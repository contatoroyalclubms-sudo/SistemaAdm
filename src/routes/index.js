const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const { messageRateLimiter } = require('../lib/rateLimiter');
const AuthService = require('../lib/auth');
const VIPManager = require('../lib/vip-manager');
const BackupManager = require('../lib/backup-manager');
const ErrorHandler = require('../lib/error-handler');

function setupRoutes(app, whatsapp, redis, logger) {
  const authService = new AuthService();
  const vipManager = new VIPManager(redis, logger);
  const backupManager = new BackupManager(logger);
  const errorHandler = new ErrorHandler(logger);
  app.get('/health', async (req, res) => {
    try {
      const waStatus = whatsapp ? whatsapp.getStatus() : { status: 'not_initialized' };
      const redisConnected = redis ? redis.isConnected : false;
      
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          whatsapp: waStatus,
          redis: { connected: redisConnected },
          api: { status: 'running' }
        },
        club: process.env.CLUB_NAME,
        rateLimit: `${process.env.RATE_LIMIT_MSGS_PER_MIN} msgs/min`
      };

      res.json(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/qr', async (req, res) => {
    try {
      if (!whatsapp) {
        return res.status(503).json({ error: 'WhatsApp service not initialized' });
      }
      const status = whatsapp.getStatus();
      const qrCode = whatsapp.getQRCode();

      res.json({
        status: status.status,
        hasQR: status.hasQR,
        qrCode: qrCode,
        phone: status.phone,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('QR endpoint failed:', error);
      res.status(500).json({
        error: 'Failed to get QR code',
        message: error.message
      });
    }
  });

  app.get('/api/menus', async (req, res) => {
    try {
      const menusPath = path.join(__dirname, '../../config/menus.json');
      const menus = await fs.readJson(menusPath);
      res.json(menus);
    } catch (error) {
      logger.error('Failed to get menus:', error);
      res.status(500).json({
        error: 'Failed to load menus',
        message: error.message
      });
    }
  });

  app.post('/api/menus', async (req, res) => {
    try {
      const menusPath = path.join(__dirname, '../../config/menus.json');
      await fs.writeJson(menusPath, req.body, { spaces: 2 });
      
      if (whatsapp && whatsapp.messageHandler) {
        await whatsapp.messageHandler.loadConfigurations();
      }
      
      res.json({
        success: true,
        message: 'Menus updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update menus:', error);
      res.status(500).json({
        error: 'Failed to update menus',
        message: error.message
      });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const productsPath = path.join(__dirname, '../../config/products.json');
      const products = await fs.readJson(productsPath);
      res.json(products);
    } catch (error) {
      logger.error('Failed to get products:', error);
      res.status(500).json({
        error: 'Failed to load products',
        message: error.message
      });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const productsPath = path.join(__dirname, '../../config/products.json');
      await fs.writeJson(productsPath, req.body, { spaces: 2 });
      
      if (whatsapp && whatsapp.messageHandler) {
        await whatsapp.messageHandler.loadConfigurations();
      }
      
      res.json({
        success: true,
        message: 'Products updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update products:', error);
      res.status(500).json({
        error: 'Failed to update products',
        message: error.message
      });
    }
  });

  app.post('/api/campaigns/send', authService.authenticate.bind(authService), messageRateLimiter, async (req, res) => {
    try {
      const campaign = req.body;
      if (!whatsapp || !whatsapp.sock) {
        return res.status(503).json({ error: 'WhatsApp service not connected' });
      }
      let success = 0, failed = 0;
      for (const contact of campaign.contacts || []) {
        try {
          const jid = `${contact.phone}@s.whatsapp.net`;
          await whatsapp.sendMessage(jid, { text: campaign.message });
          success++;
        } catch (err) {
          failed++;
        }
      }
      res.json({ success, failed });
    } catch (error) {
      logger.error('Failed to send campaign:', error);
      res.status(500).json(errorHandler.createApiErrorResponse(error, 'campaign_send'));
    }
  });

  app.post('/webhook/pix', async (req, res) => {
    try {
      logger.info('PIX webhook received:', req.body);
      
      // Process webhook with PIX service
      const pixService = require('../lib/pix-asaas');
      const pix = new pixService();
      const result = await pix.processWebhook(req.body);
      
      res.json({
        success: true,
        message: 'Webhook processed',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'pix_webhook');
      logger.error('PIX webhook failed:', errorResponse);
      res.status(500).json(errorResponse);
    }
  });

  // VIP Management Routes
  app.get('/api/vip/pending', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const pendingVIPs = await vipManager.getPendingVIPs();
      res.json({
        success: true,
        data: pendingVIPs,
        count: pendingVIPs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'vip_pending');
      res.status(500).json(errorResponse);
    }
  });

  app.get('/api/vip/confirmed', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const confirmedVIPs = await vipManager.getConfirmedVIPs();
      res.json({
        success: true,
        data: confirmedVIPs,
        count: confirmedVIPs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'vip_confirmed');
      res.status(500).json(errorResponse);
    }
  });

  app.post('/api/vip/confirm/:vipId', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const { vipId } = req.params;
      const result = await vipManager.confirmVIP(vipId);

      if (result.success && whatsapp && whatsapp.sock) {
        try {
          await vipManager.sendVIPConfirmation(whatsapp.sock, result.data.phone, result.data);
        } catch (sendError) {
          logger.warn('Failed to send WA confirmation:', sendError.message);
        }
      }

      res.json(result);
    } catch (error) {
      logger.error('Failed to confirm VIP:', error);
      res.status(500).json(errorHandler.createApiErrorResponse(error, 'vip_confirm'));
    }
  });

  app.get('/api/vip/stats', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const stats = await vipManager.getVIPStats();
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'vip_stats');
      res.status(500).json(errorResponse);
    }
  });

  // Backup Management Routes
  app.post('/api/backup/create', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const result = await backupManager.createBackup();
      res.json({
        success: result.success,
        message: result.message,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'backup_create');
      res.status(500).json(errorResponse);
    }
  });

  app.get('/api/backup/list', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const backups = await backupManager.listBackups();
      res.json({
        success: true,
        data: backups,
        count: backups.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'backup_list');
      res.status(500).json(errorResponse);
    }
  });

  app.get('/api/backup/stats', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const stats = await backupManager.getBackupStats();
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'backup_stats');
      res.status(500).json(errorResponse);
    }
  });

  app.post('/api/backup/restore', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const { backupPath } = req.body;
      
      if (!backupPath) {
        return res.status(400).json({
          success: false,
          error: 'Missing backupPath parameter',
          message: 'Please provide backupPath in request body'
        });
      }
      
      const result = await backupManager.restoreBackup(backupPath);
      res.json({
        success: result.success,
        message: result.message,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'backup_restore');
      res.status(500).json(errorResponse);
    }
  });

  // Error Statistics Route
  app.get('/api/errors/stats', authService.authenticate.bind(authService), async (req, res) => {
    try {
      const stats = errorHandler.getErrorStats();
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorResponse = errorHandler.createApiErrorResponse(error, 'error_stats');
      res.status(500).json(errorResponse);
    }
  });

  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      availableEndpoints: [
        'GET /health',
        'GET /qr',
        'GET /api/menus',
        'POST /api/menus',
        'GET /api/products',
        'POST /api/products',
        'POST /api/campaigns/send',
        'POST /webhook/pix'
      ]
    });
  });

  logger.info('Routes configured successfully');
}

module.exports = { setupRoutes };
