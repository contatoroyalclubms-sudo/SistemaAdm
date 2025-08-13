import { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { IEventRepository } from '@/domain/repositories/IEventRepository';
import { IReservationRepository } from '@/domain/repositories/IReservationRepository';
import { Lead, LeadEntity, LeadStatus, InteractionType } from '@/domain/entities/Lead';
import { Product, ProductEntity, ProductType } from '@/domain/entities/Product';
import { Event, EventEntity } from '@/domain/entities/Event';
import { ReservationEntity } from '@/domain/entities/Reservation';
import { logger, logSalesEvent } from '@/shared/logger';

export interface SalesFunnelResponse {
  message: string;
  nextStep?: string;
  options?: string[];
  shouldEscalate?: boolean;
  leadId?: string;
}

export class SalesFunnelUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private productRepository: IProductRepository,
    private eventRepository: IEventRepository,
    private reservationRepository: IReservationRepository
  ) {}

  private convertToLeadEntity(lead: Lead): LeadEntity {
    const entity = new LeadEntity(lead.id, lead.name, lead.phone);
    entity.cpf = lead.cpf;
    entity.email = lead.email;
    entity.status = lead.status;
    entity.interactions = lead.interactions;
    entity.createdAt = lead.createdAt;
    entity.updatedAt = lead.updatedAt;
    return entity;
  }

  private convertToProductEntity(product: Product): ProductEntity {
    return new ProductEntity(
      product.id,
      product.type,
      product.name,
      product.description,
      product.capacity,
      product.minimumConsumption,
      product.price,
      product.sectorMap,
      product.isActive,
      product.eventId
    );
  }

  private convertToEventEntity(event: Event): EventEntity {
    const entity = new EventEntity(
      event.id,
      event.name,
      event.date,
      event.openingTime,
      event.headliner,
      event.description,
      event.venue,
      event.status,
      event.lots,
      event.createdAt,
      event.updatedAt
    );
    return entity;
  }

  async processMessage(phone: string, message: string, customerName?: string): Promise<SalesFunnelResponse> {
    try {
      // Find or create lead
      let leadData = await this.leadRepository.findByPhone(phone);
      let leadEntity: LeadEntity;
      
      if (!leadData && customerName) {
        leadEntity = new LeadEntity(
          `lead_${Date.now()}`,
          customerName,
          phone
        );
        leadData = await this.leadRepository.create(leadEntity);
        leadEntity = this.convertToLeadEntity(leadData);
        logSalesEvent('lead_created', leadEntity.id, { phone, name: customerName });
      } else if (leadData) {
        leadEntity = this.convertToLeadEntity(leadData);
      } else {
        return {
          message: 'Olá! Para melhor atendê-lo, preciso que me informe seu nome.',
          nextStep: 'collect_name'
        };
      }

      // Add interaction
      leadEntity.addInteraction({
        type: InteractionType.MESSAGE_RECEIVED,
        content: message,
        timestamp: new Date()
      });

      // Process based on message content and lead status
      const response = await this.processBasedOnContext(leadEntity, message.toLowerCase().trim());
      
      // Update lead
      await this.leadRepository.update(leadEntity.id, leadEntity);
      
      return {
        ...response,
        leadId: leadEntity.id
      };

    } catch (error) {
      logger.error('Error processing sales funnel message', { error, phone, message });
      return {
        message: 'Desculpe, ocorreu um erro. Vou transferir você para um atendente humano.',
        shouldEscalate: true
      };
    }
  }

  private async processBasedOnContext(lead: LeadEntity, message: string): Promise<SalesFunnelResponse> {
    // Handle menu requests
    if (this.isMenuRequest(message)) {
      return this.getMainMenu();
    }

    // Handle specific product interests
    if (this.isProductInterest(message)) {
      const productType = this.extractProductType(message);
      if (productType) {
        lead.updateStatus(LeadStatus.INTERESTED);
        logSalesEvent('product_interest', lead.id, { productType });
        return this.getProductInfo(productType);
      }
    }

    // Handle availability requests
    if (this.isAvailabilityRequest(message)) {
      return this.getAvailabilityInfo();
    }

    // Handle pricing requests
    if (this.isPricingRequest(message)) {
      return this.getPricingInfo();
    }

    // Handle booking requests
    if (this.isBookingRequest(message)) {
      lead.updateStatus(LeadStatus.QUALIFIED);
      logSalesEvent('booking_interest', lead.id);
      return this.startBookingProcess(lead);
    }

    // Handle contact info collection
    if (lead.status === LeadStatus.QUALIFIED && this.needsContactInfo(lead)) {
      return this.collectContactInfo(lead, message);
    }

    // Handle general questions based on lead status
    switch (lead.status) {
      case LeadStatus.NEW:
        lead.updateStatus(LeadStatus.CONTACTED);
        return this.getWelcomeMessage();
      
      case LeadStatus.CONTACTED:
        return this.getMainMenu();
      
      case LeadStatus.INTERESTED:
        return this.provideMoreDetails();
      
      default:
        return this.getGenericResponse();
    }
  }

  private isMenuRequest(message: string): boolean {
    const menuKeywords = ['menu', 'opções', 'opcoes', 'opção', 'opcao', 'ajuda', 'help', 'oi', 'olá', 'ola'];
    return menuKeywords.some(keyword => message.includes(keyword));
  }

  private isProductInterest(message: string): boolean {
    const productKeywords = ['camarote', 'bistrô', 'bistro', 'ingresso', 'entrada', 'mesa', 'vip'];
    return productKeywords.some(keyword => message.includes(keyword));
  }

  private extractProductType(message: string): ProductType | null {
    if (message.includes('camarote')) return ProductType.CAMAROTE;
    if (message.includes('bistrô') || message.includes('bistro') || message.includes('mesa')) return ProductType.BISTRO;
    if (message.includes('ingresso') || message.includes('entrada')) return ProductType.INGRESSO;
    return null;
  }

  private isAvailabilityRequest(message: string): boolean {
    const availabilityKeywords = ['disponível', 'disponivel', 'tem', 'há', 'ha', 'sobrou', 'ainda tem'];
    return availabilityKeywords.some(keyword => message.includes(keyword));
  }

  private isPricingRequest(message: string): boolean {
    const pricingKeywords = ['preço', 'preco', 'valor', 'custa', 'quanto', 'caro', 'barato'];
    return pricingKeywords.some(keyword => message.includes(keyword));
  }

  private isBookingRequest(message: string): boolean {
    const bookingKeywords = ['quero', 'reservar', 'comprar', 'garantir', 'fechar', 'confirmar'];
    return bookingKeywords.some(keyword => message.includes(keyword));
  }

  private needsContactInfo(lead: LeadEntity): boolean {
    return !lead.cpf || !lead.email;
  }

  private getMainMenu(): SalesFunnelResponse {
    return {
      message: 
        '🎭 *ROYAL CLUB - MC DANIEL FALCÃO* 🎭\n\n' +
        'Escolha uma opção:\n\n' +
        '1️⃣ *Ingressos* - A partir de R$ 80\n' +
        '2️⃣ *Bistrô* - Mesa para até 6 pessoas\n' +
        '3️⃣ *Camarote* - Experiência VIP exclusiva\n' +
        '4️⃣ *Disponibilidade* - Consultar vagas\n' +
        '5️⃣ *Informações* - Data, local e horários\n\n' +
        '💬 *Digite o número ou palavra-chave*',
      options: ['1', '2', '3', '4', '5', 'ingressos', 'bistro', 'camarote'],
      nextStep: 'product_selection'
    };
  }

  private async getProductInfo(productType: ProductType): Promise<SalesFunnelResponse> {
    const products = await this.productRepository.findByType(productType);
    const activeProductData = products.find(p => p.isActive);

    if (!activeProductData) {
      return {
        message: `😔 Desculpe, ${productType.toLowerCase()} não está disponível no momento.\n\nGostaria de ver outras opções?`,
        nextStep: 'show_alternatives'
      };
    }

    const activeProduct = this.convertToProductEntity(activeProductData);
    const upsellType = activeProduct.getUpsellSuggestion();
    let upsellMessage = '';
    
    if (upsellType) {
      upsellMessage = `\n\n💡 *Que tal um upgrade para ${upsellType.toLowerCase()}?* Experiência ainda mais especial!`;
    }

    return {
      message: 
        `🎯 *${activeProduct.name.toUpperCase()}*\n\n` +
        `${activeProduct.getDescription()}\n\n` +
        `💰 *Valor: ${activeProduct.getFormattedPrice()}*\n\n` +
        `✨ Pronto para garantir sua experiência no show do MC Daniel Falcão?` +
        upsellMessage,
      nextStep: 'confirm_interest',
      options: ['sim', 'quero', 'garantir', 'mais informações']
    };
  }

  private async getAvailabilityInfo(): Promise<SalesFunnelResponse> {
    const events = await this.eventRepository.findUpcoming();
    const activeEventData = events[0];

    if (!activeEventData) {
      return {
        message: '⚠️ Não há eventos ativos no momento.\n\nEm breve teremos novidades! Quer que eu te avise?',
        shouldEscalate: true
      };
    }

    const activeEvent = this.convertToEventEntity(activeEventData);
    const products = await this.productRepository.findByEventId(activeEvent.id);
    const availableProducts = products
      .map(p => this.convertToProductEntity(p))
      .filter(p => p.isAvailable());

    if (availableProducts.length === 0) {
      return {
        message: '😔 Evento esgotado!\n\nMas posso te colocar na lista de espera. Interessado?',
        shouldEscalate: true
      };
    }

    const availability = availableProducts.map(p => 
      `${p.type}: ${p.getAvailableCapacity()} vagas - ${p.getFormattedPrice()}`
    ).join('\n');

    return {
      message: 
        `📅 *${activeEvent.name}*\n` +
        `📍 ${activeEvent.venue}\n` +
        `🗓️ ${activeEvent.date.toLocaleDateString('pt-BR')}\n\n` +
        `✅ *DISPONIBILIDADE:*\n${availability}\n\n` +
        `🚀 Qual opção te interessa mais?`,
      nextStep: 'product_selection'
    };
  }

  private async getPricingInfo(): Promise<SalesFunnelResponse> {
    const events = await this.eventRepository.findUpcoming();
    const activeEventData = events[0];

    if (!activeEventData) {
      return {
        message: '⚠️ Não há eventos ativos para consulta de preços.',
        shouldEscalate: true
      };
    }

    const activeEvent = this.convertToEventEntity(activeEventData);
    const products = await this.productRepository.findByEventId(activeEvent.id);
    const availableProducts = products
      .filter(p => p.isActive)
      .map(p => this.convertToProductEntity(p));

    const pricing = availableProducts.map(p => 
      `${p.type}: ${p.getFormattedPrice()}`
    ).join('\n');

    const lowestPrice = Math.min(...availableProducts.map(p => p.price));
    const currentLot = activeEvent.getCurrentLot();

    return {
      message: 
        `💰 *VALORES - MC DANIEL FALCÃO*\n\n` +
        `${pricing}\n\n` +
        `🔥 *A partir de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lowestPrice)}*\n\n` +
        (currentLot ? `⏰ Lote atual válido até: ${currentLot.validUntil.toLocaleDateString('pt-BR')}\n\n` : '') +
        `🎯 Posso garantir agora mesmo! Qual opção te interessa?`,
      nextStep: 'product_selection'
    };
  }

  private async startBookingProcess(lead: LeadEntity): Promise<SalesFunnelResponse> {
    if (!lead.cpf) {
      return {
        message: '📝 Perfeito! Para continuar, preciso do seu CPF para a reserva.\n\nPor favor, digite apenas os números:',
        nextStep: 'collect_cpf'
      };
    }

    if (!lead.email) {
      return {
        message: '📧 Agora preciso do seu e-mail para enviar a confirmação:\n\n(Digite seu melhor e-mail)',
        nextStep: 'collect_email'
      };
    }

    return {
      message: 
        '🎉 Excelente! Seus dados estão completos.\n\n' +
        '👆 Agora escolha a quantidade de pessoas e o tipo de experiência.\n\n' +
        '📞 Em instantes você receberá o link de pagamento!',
      nextStep: 'finalize_booking'
    };
  }

  private collectContactInfo(lead: LeadEntity, message: string): SalesFunnelResponse {
    if (!lead.cpf && this.isValidCPF(message)) {
      return {
        message: '✅ CPF registrado!\n\nAgora preciso do seu e-mail para enviar a confirmação:',
        nextStep: 'collect_email'
      };
    }

    if (!lead.email && this.isValidEmail(message)) {
      return {
        message: 
          '🎉 Perfeito! Dados completos.\n\n' +
          'Agora vamos escolher sua experiência. Quantas pessoas?',
        nextStep: 'finalize_booking'
      };
    }

    return {
      message: '⚠️ Formato inválido. Tente novamente ou digite *ajuda* para falar com um atendente.',
      shouldEscalate: message.toLowerCase().includes('ajuda')
    };
  }

  private getWelcomeMessage(): SalesFunnelResponse {
    return {
      message: 
        '🎭 Olá! Bem-vindo à *ROYAL CLUB*!\n\n' +
        '🔥 *MC DANIEL FALCÃO* está chegando e você não pode ficar de fora!\n\n' +
        '✨ Sou seu assistente de vendas. Digite *menu* para ver as opções disponíveis!',
      nextStep: 'show_menu'
    };
  }

  private provideMoreDetails(): SalesFunnelResponse {
    return {
      message: 
        '💎 *MAIS DETALHES:*\n\n' +
        '📅 Data: Verifique nossa agenda\n' +
        '📍 Local: Royal Club\n' +
        '🎵 Show: MC Daniel Falcão\n' +
        '⏰ Abertura da casa: Consulte horários\n\n' +
        '🎯 Pronto para garantir? Digite *quero* ou escolha uma opção do menu!',
      options: ['quero', 'menu', 'mais informações']
    };
  }

  private getGenericResponse(): SalesFunnelResponse {
    return {
      message: 
        '🤔 Não entendi muito bem...\n\n' +
        'Digite *menu* para ver as opções disponíveis ou *ajuda* para falar com um atendente humano.',
      options: ['menu', 'ajuda']
    };
  }

  private isValidCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
