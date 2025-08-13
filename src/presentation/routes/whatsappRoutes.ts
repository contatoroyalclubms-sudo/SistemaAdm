import { Router } from 'express';
import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { authMiddleware } from '../middleware/authMiddleware';
import { whatsappRateLimit } from '../middleware/rateLimitMiddleware';
import { WhatsAppMessageDto, ApiResponseDto } from '@/shared/dtos';
import { logger } from '@/shared/logger';

const router = Router();

// Global WhatsApp service instance (will be injected)
let whatsappService: any = null;
let messageHandler: any = null;

// Inject dependencies
export function setWhatsAppDependencies(service: any, handler: any) {
  whatsappService = service;
  messageHandler = handler;
}

// Get WhatsApp connection status
router.get('/status', (req: Request, res: Response) => {
  try {
    const isConnected = whatsappService?.isConnected() || false;
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        status: isConnected ? 'ready' : 'disconnected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting WhatsApp status', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get WhatsApp status'
    });
  }
});

// Get QR Code for WhatsApp connection
router.get('/qr', async (req: Request, res: Response) => {
  try {
    if (!whatsappService) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'WhatsApp service not initialized'
      });
      return;
    }

    const isConnected = whatsappService.isConnected();
    if (isConnected) {
      res.json({
        success: true,
        data: {
          connected: true,
          message: 'WhatsApp already connected'
        }
      });
      return;
    }

    const qrBase64 = await whatsappService.getQRCode();
    
    if (!qrBase64) {
      res.json({
        success: true,
        data: {
          qr: null,
          message: 'QR Code not available. Please check WhatsApp service status.'
        }
      });
      return;
    }

    // Return both base64 and HTML for easy viewing
    const qrHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Royal Club - WhatsApp QR Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
          }
          h1 { color: #FFD700; margin-bottom: 10px; }
          .subtitle { margin-bottom: 30px; opacity: 0.9; }
          .qr-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
            margin: 20px 0;
          }
          .instructions {
            margin-top: 20px;
            text-align: left;
            background: rgba(0,0,0,0.2);
            padding: 20px;
            border-radius: 10px;
          }
          .step {
            margin: 10px 0;
            padding: 5px 0;
          }
          .refresh-btn {
            background: #FFD700;
            color: #333;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
            font-weight: bold;
          }
        </style>
        <meta http-equiv="refresh" content="30">
      </head>
      <body>
        <div class="container">
          <h1>🎭 ROYAL CLUB</h1>
          <p class="subtitle">WhatsApp Bot - MC Daniel Falcão</p>
          
          <div class="qr-container">
            <img src="${qrBase64}" alt="QR Code" style="max-width: 250px;">
          </div>
          
          <div class="instructions">
            <h3>📱 Como conectar:</h3>
            <div class="step">1️⃣ Abra o WhatsApp no seu celular</div>
            <div class="step">2️⃣ Toque em ⋮ (3 pontos) > Dispositivos conectados</div>
            <div class="step">3️⃣ Toque em "Conectar um dispositivo"</div>
            <div class="step">4️⃣ Aponte a câmera para este QR Code</div>
            <div class="step">5️⃣ Aguarde a conexão ser estabelecida</div>
          </div>
          
          <button class="refresh-btn" onclick="location.reload()">🔄 Atualizar QR Code</button>
          
          <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
            Esta página atualiza automaticamente a cada 30 segundos
          </p>
        </div>
      </body>
      </html>
    `;

    // Check if request wants JSON or HTML
    const acceptsHtml = req.headers.accept?.includes('text/html');
    
    if (acceptsHtml && !req.query.json) {
      res.setHeader('Content-Type', 'text/html');
      res.send(qrHtml);
    } else {
      res.json({
        success: true,
        data: {
          qr: qrBase64,
          connected: false,
          message: 'Scan QR code with WhatsApp to connect',
          htmlUrl: `${req.protocol}://${req.get('host')}/api/whatsapp/qr`
        }
      });
    }

  } catch (error) {
    logger.error('Error getting QR code', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get QR code'
    });
  }
});

// Send message (protected route)
router.post('/send', authMiddleware, whatsappRateLimit, async (req: Request, res: Response) => {
  try {
    const validation = WhatsAppMessageDto.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid message data',
        details: validation.error.errors
      });
      return;
    }

    const { to, body } = validation.data;

    if (!whatsappService?.isConnected()) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'WhatsApp not connected'
      });
      return;
    }

    const sent = await whatsappService.sendMessage(to, body);

    if (sent) {
      res.json({
        success: true,
        data: {
          sent: true,
          to,
          messageLength: body.length,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Send Failed',
        message: 'Failed to send WhatsApp message'
      });
    }

  } catch (error) {
    logger.error('Error sending WhatsApp message', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to send message'
    });
  }
});

// Send broadcast message (protected route)
router.post('/broadcast', authMiddleware, whatsappRateLimit, async (req: Request, res: Response) => {
  try {
    const { phones, message } = req.body;

    if (!Array.isArray(phones) || phones.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'phones must be a non-empty array'
      });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'message is required and must be a string'
      });
      return;
    }

    if (!whatsappService?.isConnected()) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'WhatsApp not connected'
      });
      return;
    }

    if (!messageHandler) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Message handler not available'
      });
      return;
    }

    // Limit broadcast size
    if (phones.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Maximum 100 phones per broadcast'
      });
      return;
    }

    const results = await messageHandler.sendBroadcast(phones, message);

    res.json({
      success: true,
      data: {
        totalRecipients: phones.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending broadcast', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to send broadcast'
    });
  }
});

// Send image (protected route)
router.post('/send-image', authMiddleware, whatsappRateLimit, async (req: Request, res: Response) => {
  try {
    const { to, imagePath, caption } = req.body;

    if (!to || !imagePath) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'to and imagePath are required'
      });
      return;
    }

    if (!whatsappService?.isConnected()) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'WhatsApp not connected'
      });
      return;
    }

    const sent = await whatsappService.sendImage(to, imagePath, caption);

    if (sent) {
      res.json({
        success: true,
        data: {
          sent: true,
          to,
          imagePath,
          caption: caption || '',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Send Failed',
        message: 'Failed to send WhatsApp image'
      });
    }

  } catch (error) {
    logger.error('Error sending WhatsApp image', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to send image'
    });
  }
});

export { router as whatsappRoutes };
