/**
 * VIP Management System
 */

const crypto = require('crypto');

class VIPManager {
  constructor(redis, logger) {
    this.redis = redis;
    this.logger = logger;
    this.prefix = 'vip:';
  }

  /**
   * Process VIP entry request
   * @param {string} phone - Customer phone
   * @param {string} message - Raw message
   * @returns {Promise<Object>} Processing result
   */
  async processVIPEntry(phone, message) {
    try {
      const vipData = this.parseVIPMessage(message);
      
      if (!vipData.valid) {
        return {
          success: false,
          message: 'Formato inválido. Use: VIP NOME RG 00.000.000-0',
          data: null
        };
      }

      const vipId = this.generateVIPId(phone);
      const timestamp = new Date().toISOString();
      
      const vipEntry = {
        id: vipId,
        phone,
        name: vipData.name,
        rg: vipData.rg,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        message: message,
        confirmed: false,
        confirmedAt: null,
        confirmedBy: null
      };

      // Save to Redis
      await this.redis.set(`${this.prefix}${vipId}`, vipEntry, 24 * 60 * 60); // 24 hours
      await this.redis.set(`${this.prefix}phone:${phone}`, vipId, 24 * 60 * 60);
      
      // Add to pending list
      await this.redis.set(`${this.prefix}pending:${vipId}`, vipEntry, 24 * 60 * 60);
      
      this.logger.info(`VIP entry created: ${vipId} for ${phone}`);
      
      return {
        success: true,
        message: '✅ Entrada VIP registrada! Aguarde confirmação em até 5 minutos.',
        data: vipEntry
      };
    } catch (error) {
      this.logger.error('Error processing VIP entry:', error);
      return {
        success: false,
        message: '❌ Erro ao processar entrada VIP. Tente novamente.',
        data: null
      };
    }
  }

  /**
   * Parse VIP message
   * @param {string} message - Raw message
   * @returns {Object} Parsed data
   */
  parseVIPMessage(message) {
    const vipRegex = /^vip\s+([a-zA-ZÀ-ÿ\s]+)\s+rg\s+(\d{2}\.\d{3}\.\d{3}-\d{1})$/i;
    const match = message.match(vipRegex);
    
    if (!match) {
      return { valid: false };
    }
    
    return {
      valid: true,
      name: match[1].trim(),
      rg: match[2]
    };
  }

  /**
   * Generate unique VIP ID
   * @param {string} phone - Phone number
   * @returns {string} VIP ID
   */
  generateVIPId(phone) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `vip_${phone}_${timestamp}_${random}`;
  }

  /**
   * Confirm VIP entry
   * @param {string} vipId - VIP ID
   * @param {string} confirmedBy - Who confirmed
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmVIP(vipId, confirmedBy = 'admin') {
    try {
      const vipEntry = await this.redis.get(`${this.prefix}${vipId}`);
      
      if (!vipEntry) {
        return {
          success: false,
          message: 'VIP entry not found'
        };
      }

      vipEntry.status = 'confirmed';
      vipEntry.confirmed = true;
      vipEntry.confirmedAt = new Date().toISOString();
      vipEntry.confirmedBy = confirmedBy;
      vipEntry.updatedAt = new Date().toISOString();

      // Update in Redis
      await this.redis.set(`${this.prefix}${vipId}`, vipEntry, 24 * 60 * 60);
      await this.redis.set(`${this.prefix}confirmed:${vipId}`, vipEntry, 24 * 60 * 60);
      
      // Remove from pending
      await this.redis.del(`${this.prefix}pending:${vipId}`);
      
      this.logger.info(`VIP confirmed: ${vipId} by ${confirmedBy}`);
      
      return {
        success: true,
        message: 'VIP confirmed successfully',
        data: vipEntry
      };
    } catch (error) {
      this.logger.error('Error confirming VIP:', error);
      return {
        success: false,
        message: 'Error confirming VIP'
      };
    }
  }

  /**
   * Get VIP by phone
   * @param {string} phone - Phone number
   * @returns {Promise<Object|null>} VIP data
   */
  async getVIPByPhone(phone) {
    try {
      const vipId = await this.redis.get(`${this.prefix}phone:${phone}`);
      if (!vipId) return null;
      
      return await this.redis.get(`${this.prefix}${vipId}`);
    } catch (error) {
      this.logger.error('Error getting VIP by phone:', error);
      return null;
    }
  }

  /**
   * Get all pending VIPs
   * @returns {Promise<Array>} Pending VIPs
   */
  async getPendingVIPs() {
    try {
      const keys = await this.redis.keys(`${this.prefix}pending:*`);
      const pendingVIPs = [];
      
      for (const key of keys) {
        const vipEntry = await this.redis.get(key);
        if (vipEntry) {
          pendingVIPs.push(vipEntry);
        }
      }
      
      return pendingVIPs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } catch (error) {
      this.logger.error('Error getting pending VIPs:', error);
      return [];
    }
  }

  /**
   * Get all confirmed VIPs
   * @returns {Promise<Array>} Confirmed VIPs
   */
  async getConfirmedVIPs() {
    try {
      const keys = await this.redis.keys(`${this.prefix}confirmed:*`);
      const confirmedVIPs = [];
      
      for (const key of keys) {
        const vipEntry = await this.redis.get(key);
        if (vipEntry) {
          confirmedVIPs.push(vipEntry);
        }
      }
      
      return confirmedVIPs.sort((a, b) => new Date(a.confirmedAt) - new Date(b.confirmedAt));
    } catch (error) {
      this.logger.error('Error getting confirmed VIPs:', error);
      return [];
    }
  }

  /**
   * Get VIP statistics
   * @returns {Promise<Object>} Statistics
   */
  async getVIPStats() {
    try {
      const pendingKeys = await this.redis.keys(`${this.prefix}pending:*`);
      const confirmedKeys = await this.redis.keys(`${this.prefix}confirmed:*`);
      
      return {
        pending: pendingKeys.length,
        confirmed: confirmedKeys.length,
        total: pendingKeys.length + confirmedKeys.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting VIP stats:', error);
      return {
        pending: 0,
        confirmed: 0,
        total: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Send VIP confirmation message
   * @param {Object} sock - WhatsApp socket
   * @param {string} phone - Phone number
   * @param {Object} vipData - VIP data
   * @returns {Promise<boolean>} Success
   */
  async sendVIPConfirmation(sock, phone, vipData) {
    try {
      const message = `👑 *VIP CONFIRMADO - ${process.env.CLUB_NAME}*\n\n` +
                     `✅ Olá ${vipData.name}!\n\n` +
                     `🎉 Sua entrada VIP foi confirmada!\n\n` +
                     `📋 *Detalhes:*\n` +
                     `• Nome: ${vipData.name}\n` +
                     `• RG: ${vipData.rg}\n` +
                     `• Status: ✅ Confirmado\n\n` +
                     `🎊 Aproveite sua experiência VIP!\n\n` +
                     `📍 Local: Royal Club\n` +
                     `🕐 Horário: 22h\n\n` +
                     `📞 Dúvidas? Entre em contato.`;

      const jid = `${phone}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: message });
      
      this.logger.info(`VIP confirmation sent to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending VIP confirmation:', error);
      return false;
    }
  }
}

module.exports = VIPManager;
