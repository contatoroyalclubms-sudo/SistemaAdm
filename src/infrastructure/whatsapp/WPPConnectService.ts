import { create, Whatsapp, Message } from '@wppconnect-team/wppconnect';
import { logger, logWhatsAppMessage } from '@/shared/logger';
import { EventEmitter } from 'events';

export interface IWhatsAppService {
  initialize(): Promise<void>;
  sendMessage(to: string, message: string): Promise<boolean>;
  sendImage(to: string, imagePath: string, caption?: string): Promise<boolean>;
  isConnected(): boolean;
  getQRCode(): Promise<string | null>;
  on(event: string, listener: Function): void;
}

export class WPPConnectService extends EventEmitter implements IWhatsAppService {
  private client: Whatsapp | null = null;
  private isReady = false;
  private qrCode: string | null = null;
  private sessionName: string;

  constructor(sessionName: string = 'royal-club-session') {
    super();
    this.sessionName = sessionName;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing WhatsApp client', { sessionName: this.sessionName });

      this.client = await create({
        session: this.sessionName,
        catchQR: (base64Qr, asciiQR) => {
          this.qrCode = base64Qr;
          logger.info('QR Code generated');
          this.emit('qr', base64Qr);
          console.log('QR Code ASCII:\n', asciiQR);
        },
        statusFind: (statusSession, session) => {
          logger.info('WhatsApp session status', { status: statusSession, session });
          this.emit('status', statusSession);
          
          if (statusSession === 'isLogged') {
            this.isReady = true;
            this.qrCode = null;
            this.emit('ready');
          }
        },
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: false,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      // Set up message listeners
      this.client.onMessage(this.handleIncomingMessage.bind(this));
      this.client.onIncomingCall(this.handleIncomingCall.bind(this));

      logger.info('WhatsApp client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', { error });
      throw error;
    }
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.client || !this.isReady) {
      logger.warn('WhatsApp client not ready', { to, messageLength: message.length });
      return false;
    }

    try {
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);
      
      await this.client.sendText(formattedNumber, message);
      
      logWhatsAppMessage('outgoing', 'bot', to, message);
      this.emit('message_sent', { to: formattedNumber, message });
      
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { error, to, messageLength: message.length });
      return false;
    }
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    if (!this.client || !this.isReady) {
      logger.warn('WhatsApp client not ready', { to, imagePath });
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      await this.client.sendImage(formattedNumber, imagePath, 'image', caption || '');
      
      logWhatsAppMessage('outgoing', 'bot', to, `[IMAGE] ${caption || ''}`);
      this.emit('image_sent', { to: formattedNumber, imagePath, caption });
      
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp image', { error, to, imagePath });
      return false;
    }
  }

  isConnected(): boolean {
    return this.isReady;
  }

  async getQRCode(): Promise<string | null> {
    return this.qrCode;
  }

  private async handleIncomingMessage(message: Message): Promise<void> {
    try {
      // Skip messages from groups, status updates, and own messages
      if (message.isGroupMsg || message.from === 'status@broadcast' || message.fromMe) {
        return;
      }

      const messageData = {
        id: message.id,
        from: message.from,
        fromName: message.sender.pushname || message.sender.name || 'Unknown',
        body: message.body,
        timestamp: message.timestamp,
        type: message.type
      };

      logWhatsAppMessage('incoming', message.from, 'bot', message.body || '');
      this.emit('message', messageData);

    } catch (error) {
      logger.error('Error handling incoming message', { error, messageId: message.id });
    }
  }

  private async handleIncomingCall(call: any): Promise<void> {
    try {
      logger.info('Incoming call received', { from: call.peerJid });
      
      // Auto reject calls and send message
      await this.client?.sendText(
        call.peerJid,
        '🤖 Olá! Este é um atendimento automatizado via WhatsApp.\n\n' +
        'Para melhor atendê-lo, prefiro conversar por mensagens de texto.\n\n' +
        'Digite *menu* para ver as opções disponíveis! 🎭'
      );

      this.emit('call_received', { from: call.peerJid });
    } catch (error) {
      logger.error('Error handling incoming call', { error });
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    // Ensure proper format for WhatsApp
    return cleaned + '@c.us';
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        this.isReady = false;
        this.client = null;
        logger.info('WhatsApp client closed');
      } catch (error) {
        logger.error('Error closing WhatsApp client', { error });
      }
    }
  }
}
