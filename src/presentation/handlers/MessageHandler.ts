import { IWhatsAppService } from '@/infrastructure/whatsapp/WPPConnectService';
import { SalesFunnelUseCase } from '@/application/use-cases/SalesFunnelUseCase';
import { PrismaLeadRepository } from '@/infrastructure/repositories/PrismaLeadRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaEventRepository } from '@/infrastructure/repositories/PrismaEventRepository';
import { PrismaReservationRepository } from '@/infrastructure/repositories/PrismaReservationRepository';
import { logger, logWhatsAppMessage } from '@/shared/logger';

interface WhatsAppMessage {
  id: string;
  from: string;
  fromName: string;
  body: string;
  timestamp: number;
  type: string;
}

export class MessageHandler {
  private salesFunnel: SalesFunnelUseCase;

  constructor(private whatsappService: IWhatsAppService) {
    // Initialize repositories
    const leadRepository = new PrismaLeadRepository();
    const productRepository = new PrismaProductRepository();
    const eventRepository = new PrismaEventRepository();
    const reservationRepository = new PrismaReservationRepository();

    // Initialize use cases
    this.salesFunnel = new SalesFunnelUseCase(
      leadRepository,
      productRepository,
      eventRepository,
      reservationRepository
    );
  }

  async handleMessage(message: WhatsAppMessage): Promise<void> {
    try {
      logger.info('Processing WhatsApp message', {
        messageId: message.id,
        from: message.from.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
        messageLength: message.body.length,
        type: message.type
      });

      // Skip non-text messages for now
      if (message.type !== 'text' && message.type !== 'chat') {
        await this.handleNonTextMessage(message);
        return;
      }

      // Skip empty messages
      if (!message.body || message.body.trim().length === 0) {
        return;
      }

      // Extract phone number (remove WhatsApp suffix)
      const phone = message.from.replace('@c.us', '');
      const customerName = message.fromName;

      // Process through sales funnel
      const response = await this.salesFunnel.processMessage(
        phone,
        message.body,
        customerName
      );

      // Send response
      if (response.message) {
        const sent = await this.whatsappService.sendMessage(phone, response.message);
        
        if (sent) {
          logWhatsAppMessage('outgoing', 'bot', phone, response.message);
        } else {
          logger.error('Failed to send WhatsApp response', {
            messageId: message.id,
            phone: phone.replace(/\d(?=\d{4})/g, '*')
          });
        }
      }

      // Handle escalation to human
      if (response.shouldEscalate) {
        await this.escalateToHuman(phone, message.body, customerName, response.leadId);
      }

    } catch (error) {
      logger.error('Error handling WhatsApp message', {
        error,
        messageId: message.id
      });

      // Send error message to user
      await this.sendErrorMessage(message.from.replace('@c.us', ''));
    }
  }

  private async handleNonTextMessage(message: WhatsAppMessage): Promise<void> {
    const phone = message.from.replace('@c.us', '');
    
    let responseMessage = '';
    
    switch (message.type) {
      case 'image':
        responseMessage = '📸 Recebi sua imagem! Para continuar, digite uma mensagem de texto ou *menu* para ver as opções.';
        break;
      case 'audio':
        responseMessage = '🎵 Recebi seu áudio! Para melhor atendê-lo, prefiro mensagens de texto. Digite *menu* para ver as opções.';
        break;
      case 'video':
        responseMessage = '🎥 Recebi seu vídeo! Para continuar, digite uma mensagem de texto ou *menu* para ver as opções.';
        break;
      case 'document':
        responseMessage = '📄 Recebi seu documento! Para continuar, digite uma mensagem de texto ou *menu* para ver as opções.';
        break;
      default:
        responseMessage = '🤖 Recebi sua mensagem! Para melhor atendê-lo, digite *menu* para ver as opções disponíveis.';
    }

    await this.whatsappService.sendMessage(phone, responseMessage);
  }

  private async escalateToHuman(
    phone: string, 
    originalMessage: string, 
    customerName: string,
    leadId?: string
  ): Promise<void> {
    try {
      // Send message to customer
      const customerMessage = 
        '👨‍💼 Vou transferir você para um de nossos especialistas!\n\n' +
        '⏰ Em instantes alguém entrará em contato para te atender melhor.\n\n' +
        '🙏 Obrigado pela paciência!';

      await this.whatsappService.sendMessage(phone, customerMessage);

      // Notify admin
      const adminPhone = process.env.ADMIN_PHONE;
      if (adminPhone) {
        const adminNotification = 
          '🚨 *ESCALAÇÃO DE ATENDIMENTO* 🚨\n\n' +
          `👤 Cliente: ${customerName}\n` +
          `📱 Telefone: ${phone}\n` +
          `💬 Mensagem: "${originalMessage}"\n` +
          `🆔 Lead ID: ${leadId || 'N/A'}\n\n` +
          `⏰ ${new Date().toLocaleString('pt-BR')}\n\n` +
          `🎯 *Entrar em contato o quanto antes!*`;

        await this.whatsappService.sendMessage(adminPhone, adminNotification);
      }

      logger.info('Message escalated to human', {
        phone: phone.replace(/\d(?=\d{4})/g, '*'),
        customerName,
        leadId,
        originalMessage: originalMessage.substring(0, 100)
      });

    } catch (error) {
      logger.error('Error escalating to human', { error, phone, leadId });
    }
  }

  private async sendErrorMessage(phone: string): Promise<void> {
    const errorMessage = 
      '😔 Ops! Ocorreu um erro inesperado.\n\n' +
      '🔄 Tente novamente em alguns instantes ou digite *ajuda* para falar com um atendente.\n\n' +
      '🙏 Pedimos desculpas pelo inconveniente!';

    await this.whatsappService.sendMessage(phone, errorMessage);
  }

  // Public method to send broadcast messages
  async sendBroadcast(phones: string[], message: string): Promise<{
    sent: number;
    failed: number;
    errors: Array<{ phone: string; error: string }>;
  }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ phone: string; error: string }>
    };

    for (const phone of phones) {
      try {
        const sent = await this.whatsappService.sendMessage(phone, message);
        
        if (sent) {
          results.sent++;
          // Add delay between messages to avoid spam detection
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          results.failed++;
          results.errors.push({ phone, error: 'Failed to send message' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ 
          phone, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    logger.info('Broadcast completed', {
      totalPhones: phones.length,
      sent: results.sent,
      failed: results.failed
    });

    return results;
  }
}
