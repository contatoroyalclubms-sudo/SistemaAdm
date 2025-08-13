const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');
const MessageHandler = require('../handlers/messageHandler');

class WhatsAppService {
  constructor(redis, logger) {
    this.redis = redis;
    this.logger = logger;
    this.sock = null;
    this.qrCode = null;
    this.connectionStatus = 'disconnected';
    this.sessionPath = process.env.WA_SESSION_PATH || './storage/session';
    this.messageHandler = new MessageHandler(redis, logger);
    
    fs.ensureDirSync(this.sessionPath);
  }

  async initialize() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: this.logger.child({ module: 'baileys' }),
        browser: ['Royal Club Bot', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('messages.upsert', async (m) => {
        await this.handleIncomingMessages(m);
      });

      this.logger.info('WhatsApp socket initialized');
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp:', error);
      throw error;
    }
  }

  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.qrCode = await QRCode.toDataURL(qr);
      this.connectionStatus = 'qr_scan_required';
      this.logger.info('QR Code generated - scan to connect');
      console.log('\n📱 Scan this QR code with WhatsApp:');
      console.log(qr);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      this.connectionStatus = 'disconnected';
      
      if (shouldReconnect) {
        this.logger.info('Connection closed, reconnecting...');
        await this.initialize();
      } else {
        this.logger.info('Connection closed, logged out');
        this.qrCode = null;
      }
    } else if (connection === 'open') {
      this.connectionStatus = 'connected';
      this.qrCode = null;
      this.logger.info('✅ WhatsApp connected successfully!');
      
      await this.redis.set('wa:status', {
        status: 'connected',
        timestamp: new Date().toISOString(),
        phone: this.sock.user?.id
      });
    }
  }

  async handleIncomingMessages(m) {
    const messages = m.messages;
    
    for (const message of messages) {
      if (!message.key.fromMe && message.message) {
        await this.messageHandler.processMessage(this.sock, message);
      }
    }
  }

  async sendMessage(jid, content) {
    if (!this.sock || this.connectionStatus !== 'connected') {
      throw new Error('WhatsApp not connected');
    }

    try {
      await this.sock.sendMessage(jid, content);
      this.logger.info(`Message sent to ${jid}`);
    } catch (error) {
      this.logger.error(`Failed to send message to ${jid}:`, error);
      throw error;
    }
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.connectionStatus = 'disconnected';
      this.logger.info('WhatsApp disconnected');
    }
  }

  getStatus() {
    return {
      status: this.connectionStatus,
      hasQR: !!this.qrCode,
      phone: this.sock?.user?.id || null
    };
  }

  getQRCode() {
    return this.qrCode;
  }
}

module.exports = WhatsAppService;
