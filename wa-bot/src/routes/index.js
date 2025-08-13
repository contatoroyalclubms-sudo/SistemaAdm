const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const { messageRateLimiter } = require('../lib/rateLimiter');

function setupRoutes(app, whatsapp, redis, logger) {
  app.get('/health', async (req, res) => {
    try {
      const waStatus = whatsapp.getStatus();
      const redisConnected = redis.isConnected;
      
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
      
      if (whatsapp.messageHandler) {
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
      
      if (whatsapp.messageHandler) {
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

  app.post('/api/campaigns/send', async (req, res) => {
    try {
      const { file, message: customMessage } = req.body;
      
      if (!file) {
        return res.status(400).json({
          error: 'Missing file parameter',
          message: 'Please provide a CSV file path'
        });
      }

      const csvPath = path.join(__dirname, '../../', file);
      
      if (!await fs.pathExists(csvPath)) {
        return res.status(404).json({
          error: 'File not found',
          message: `CSV file not found: ${file}`
        });
      }

      const campaigns = [];
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on('data', (row) => {
            if (row.phone && row.message) {
              campaigns.push({
                phone: row.phone.replace(/\D/g, ''), // Remove non-digits
                message: customMessage || row.message
              });
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      if (campaigns.length === 0) {
        return res.status(400).json({
          error: 'No valid campaigns found',
          message: 'CSV file must contain phone and message columns'
        });
      }

      let sent = 0;
      let failed = 0;
      const results = [];

      for (const campaign of campaigns) {
        try {
          await messageRateLimiter.consume('global_messages');
          
          const jid = `${campaign.phone}@s.whatsapp.net`;
          
          await whatsapp.sendMessage(jid, { text: campaign.message });
          
          sent++;
          results.push({
            phone: campaign.phone,
            status: 'sent',
            timestamp: new Date().toISOString()
          });
          
          logger.info(`Campaign message sent to ${campaign.phone}`);
          
        } catch (error) {
          failed++;
          results.push({
            phone: campaign.phone,
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          logger.error(`Failed to send campaign to ${campaign.phone}:`, error);
          
          if (error.remainingPoints !== undefined) {
            await new Promise(resolve => setTimeout(resolve, error.msBeforeNext || 5000));
          }
        }
      }

      res.json({
        success: true,
        summary: {
          total: campaigns.length,
          sent,
          failed,
          rateLimit: `${process.env.RATE_LIMIT_MSGS_PER_MIN} msgs/min`
        },
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Campaign send failed:', error);
      res.status(500).json({
        error: 'Campaign send failed',
        message: error.message
      });
    }
  });

  app.post('/webhook/pix', async (req, res) => {
    try {
      logger.info('PIX webhook received:', req.body);
      
      
      res.json({
        success: true,
        message: 'Webhook processed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('PIX webhook failed:', error);
      res.status(500).json({
        error: 'Webhook processing failed',
        message: error.message
      });
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
