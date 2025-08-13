const fs = require('fs-extra');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const PIXService = require('../lib/pix');

class MessageHandler {
  constructor(redis, logger) {
    this.redis = redis;
    this.logger = logger;
    this.pixService = new PIXService();
    
    this.rateLimiter = new RateLimiterMemory({
      keyGenerator: () => 'global',
      points: parseInt(process.env.RATE_LIMIT_MSGS_PER_MIN) || 12,
      duration: 60,
    });

    this.images = {
      flyer: path.resolve('./storage/royal/mc-daniel-flyer.png'),
      mapa: path.resolve('./storage/royal/mapa-camarotes.png'),
      logo: path.resolve('./storage/royal/royal-logo.png')
    };
    
    this.salesLink = 'https://links.totalingressos.com/mc-daniel-na-royal.html';

    this.loadConfigurations();
  }

  async loadConfigurations() {
    try {
      const menusPath = path.join(__dirname, '../../config/menus.json');
      this.menus = await fs.readJson(menusPath);
      
      const productsPath = path.join(__dirname, '../../config/products.json');
      this.products = await fs.readJson(productsPath);
      
      this.logger.info('Configurations loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load configurations:', error);
      this.menus = { main: [] };
      this.products = [];
    }
  }

  async processMessage(sock, message) {
    try {
      const messageText = this.extractMessageText(message);
      const senderJid = message.key.remoteJid;
      const senderPhone = senderJid.split('@')[0];

      if (!messageText) return;

      this.logger.info(`Message from ${senderPhone}: ${messageText}`);

      try {
        await this.rateLimiter.consume('global');
      } catch (rateLimitError) {
        this.logger.warn('Rate limit exceeded, skipping message processing');
        return;
      }

      const intent = this.detectIntent(messageText.toLowerCase());
      await this.handleIntent(sock, senderJid, senderPhone, intent, messageText);

    } catch (error) {
      this.logger.error('Error processing message:', error);
    }
  }

  extractMessageText(message) {
    if (message.message?.conversation) {
      return message.message.conversation;
    }
    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }
    return null;
  }

  detectIntent(messageText) {
    const text = messageText.toLowerCase().trim();
    
    if (text.includes('menu') || text === 'oi' || text === 'olá' || text === 'help') {
      return 'menu';
    }
    if (text.includes('vip')) {
      return 'vip';
    }
    if (text.includes('ingresso') || text.includes('ticket')) {
      return 'ingresso';
    }
    if (text.includes('mapa')) {
      return 'mapa';
    }
    if (text.includes('camarote')) {
      return 'camarote';
    }
    if (text.includes('aniversário') || text.includes('aniversario') || text.includes('birthday')) {
      return 'aniversario';
    }
    if (text.includes('local') || text.includes('endereço') || text.includes('endereco') || text.includes('onde')) {
      return 'local';
    }
    if (text.includes('promoter') || text.includes('divulgador')) {
      return 'promoter';
    }
    if (text.includes('comprovante') || text.includes('pago') || text.includes('pagamento')) {
      return 'comprovante';
    }
    
    return 'unknown';
  }

  async handleIntent(sock, jid, phone, intent, originalMessage) {
    switch (intent) {
      case 'menu':
        await this.sendMenuWithImage(sock, jid);
        break;
      
      case 'vip':
        const vipResponse = await this.handleVipIntent(phone, originalMessage);
        await this.sendResponse(sock, jid, vipResponse);
        break;
      
      case 'ingresso':
        await this.sendIngressoWithImage(sock, jid, phone);
        break;
      
      case 'mapa':
      case 'camarote':
        await this.sendMapaWithImage(sock, jid);
        break;
      
      case 'aniversario':
        const aniversarioResponse = this.handleAniversarioIntent();
        await this.sendResponse(sock, jid, aniversarioResponse);
        break;
      
      case 'local':
        const localResponse = this.handleLocalIntent();
        await this.sendResponse(sock, jid, localResponse);
        break;
      
      case 'promoter':
        const promoterResponse = this.handlePromoterIntent();
        await this.sendResponse(sock, jid, promoterResponse);
        break;
      
      case 'comprovante':
        const comprovanteResponse = await this.handleComprovanteIntent(phone);
        await this.sendResponse(sock, jid, comprovanteResponse);
        break;
      
      default:
        if (/^vip\s+/i.test(originalMessage)) {
          await this.handleVipEntry(sock, jid, phone, originalMessage);
        } else {
          const menuResponse = this.generateMenuResponse();
          await this.sendResponse(sock, jid, menuResponse);
        }
        break;
    }
  }

  generateMenuResponse() {
    const clubName = process.env.CLUB_NAME || 'Royal Club';
    const menuLines = [
      `✨ *${clubName}*`,
      ...(this.menus.menu || [
        '🎤 MC Daniel — 16 AGO (Sáb) 22h',
        '1) Ingressos',
        '2) Mapa/Camarotes',
        '3) Lista/VIP',
        '4) Aniversariante',
        '5) Localização'
      ]),
      'Diga: ingresso | mapa | camarote | vip | aniversario | local'
    ];
    return menuLines.join('\n');
  }

  async sendMenuWithImage(sock, jid) {
    const menuText = this.generateMenuResponse();
    
    if (fs.existsSync(this.images.flyer)) {
      await sock.sendMessage(jid, { 
        image: { url: this.images.flyer }, 
        caption: menuText 
      });
      this.logger.info(`Menu with flyer image sent to ${jid}`);
    } else {
      await this.sendResponse(sock, jid, menuText);
    }
  }

  async sendIngressoWithImage(sock, jid, phone) {
    const product = this.products.items?.find(x => x.slug === 'ingresso-unissex') || 
      { name: 'Ingresso Unissex', price: 60 };
    
    const caption = `🎟 *${product.name}*: R$ ${Number(product.price).toFixed(2)}\nCompre pelo link oficial:\n${this.salesLink}\nApós o pagamento, envie "COMPROVANTE".`;

    if (fs.existsSync(this.images.logo)) {
      await sock.sendMessage(jid, { 
        image: { url: this.images.logo }, 
        caption: caption 
      });
      this.logger.info(`Ingresso with logo image sent to ${jid}`);
    } else {
      await this.sendResponse(sock, jid, caption);
    }
  }

  async sendMapaWithImage(sock, jid) {
    const caption = `🗺 *Mapa de Camarotes e Bistrô*\nFaça sua reserva pelo atendimento ou compre o ingresso no link oficial.\n${this.salesLink}`;

    if (fs.existsSync(this.images.mapa)) {
      await sock.sendMessage(jid, { 
        image: { url: this.images.mapa }, 
        caption: caption 
      });
      this.logger.info(`Mapa with camarote image sent to ${jid}`);
    } else {
      await this.sendResponse(sock, jid, caption);
    }
  }

  async handleVipIntent(phone, message) {
    const vipInfo = {
      phone,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    await this.redis.set(`vip:${phone}`, vipInfo);

    return `👑 *Área VIP - ${process.env.CLUB_NAME}*\n\n` +
           `✨ Obrigado pelo interesse na nossa área VIP!\n\n` +
           `📋 *Benefícios VIP:*\n` +
           `• Entrada prioritária\n` +
           `• Mesa reservada\n` +
           `• Bebidas premium\n` +
           `• Atendimento exclusivo\n\n` +
           `📞 Nossa equipe entrará em contato em breve para finalizar sua reserva VIP.\n\n` +
           `🎉 Prepare-se para uma experiência única!`;
  }

  async handleIngressoIntent(phone) {
    const product = this.products.items?.find(x => x.slug === 'ingresso-unissex') || 
      { name: 'Ingresso Unissex', price: 60 };
    
    return `🎟 *${product.name}*: R$ ${Number(product.price).toFixed(2)}\nCompre pelo link oficial:\n${this.salesLink}\nApós o pagamento, envie "COMPROVANTE".`;
  }

  handleAniversarioIntent() {
    return '🎉 *Aniversariante*: Mín. 10 pagantes → bolo + área reservada. Responda "PROMO ANIVER" para falar com atendente.';
  }

  handleLocalIntent() {
    return '📍 Royal Club — Rua Arquiteto Rubens Gil de Camilo, 20.\nMapa: https://maps.google.com/?q=-20.467,-54.620';
  }

  handlePromoterIntent() {
    return '👤 *Promoter*: Envie "PROMO CÓDIGO-DO-PROMOTER" para garantir desconto e ranking.';
  }

  async handleComprovanteIntent(phone) {
    return '✅ Comprovante recebido! Assim que confirmado, enviamos sua liberação.';
  }

  async handleVipEntry(sock, jid, phone, text) {
    try {
      const vipData = {
        from: phone,
        payload: text,
        timestamp: new Date().toISOString()
      };
      await this.redis.set(`vip:${phone}:${Date.now()}`, JSON.stringify(vipData));
      await this.sendResponse(sock, jid, '✅ Recebido! Processando sua entrada VIP. Aguarde confirmação.');
      this.logger.info(`VIP entry saved for ${phone}`);
    } catch (error) {
      this.logger.error('Error saving VIP entry:', error);
      await this.sendResponse(sock, jid, '❌ Erro ao processar entrada VIP. Tente novamente.');
    }
  }

  async sendResponse(sock, jid, message) {
    try {
      await sock.sendMessage(jid, { text: message });
      this.logger.info(`Response sent to ${jid}`);
    } catch (error) {
      this.logger.error(`Failed to send response to ${jid}:`, error);
    }
  }
}

module.exports = MessageHandler;
