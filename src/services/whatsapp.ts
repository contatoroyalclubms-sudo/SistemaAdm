import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket, ConnectionState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from '@/shared/logger';

interface WhatsAppServiceInterface {
  initialize(): Promise<void>;
  sendMessage(jid: string, content: any): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): any;
  getQRCode(): string | null;
}

export class WhatsAppService implements WhatsAppServiceInterface {
  private sock: WASocket | null = null;
  private qrCode: string | null = null;
  private connectionStatus: string = 'disconnected';
  private sessionPath: string;

  constructor() {
    this.sessionPath = process.env.WA_SESSION_PATH || './storage/session';
    fs.ensureDirSync(this.sessionPath);
  }

  async initialize(): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Royal Club Bot', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        await this.handleConnectionUpdate(update);
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('messages.upsert', async (m: any) => {
        await this.handleIncomingMessages(m);
      });

      logger.info('WhatsApp socket initialized');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp:', error);
      throw error;
    }
  }

  private async handleConnectionUpdate(update: Partial<ConnectionState>): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.qrCode = await QRCode.toDataURL(qr);
      this.connectionStatus = 'qr_scan_required';
      logger.info('QR Code generated - scan to connect');
      console.log('\n📱 Scan this QR code with WhatsApp:');
      console.log(qr);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      this.connectionStatus = 'disconnected';
      
      if (shouldReconnect) {
        logger.info('Connection closed, reconnecting...');
        await this.initialize();
      } else {
        logger.info('Connection closed, logged out');
        this.qrCode = null;
      }
    } else if (connection === 'open') {
      this.connectionStatus = 'connected';
      this.qrCode = null;
      logger.info('✅ WhatsApp connected successfully!');
    }
  }

  private async handleIncomingMessages(m: any): Promise<void> {
    const messages = m.messages;
    
    for (const message of messages) {
      if (!message.key.fromMe && message.message) {
        logger.info('Received message', { from: message.key.remoteJid, type: message.message });
      }
    }
  }

  async sendMessage(jid: string, content: any): Promise<void> {
    if (!this.sock || this.connectionStatus !== 'connected') {
      throw new Error('WhatsApp not connected');
    }

    try {
      await this.sock.sendMessage(jid, content);
      logger.info(`Message sent to ${jid}`);
    } catch (error) {
      logger.error(`Failed to send message to ${jid}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.connectionStatus = 'disconnected';
      logger.info('WhatsApp disconnected');
    }
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  getStatus(): any {
    return {
      status: this.connectionStatus,
      hasQR: !!this.qrCode,
      phone: this.sock?.user?.id || null
    };
  }

  getQRCode(): string | null {
    return this.qrCode;
  }
}
