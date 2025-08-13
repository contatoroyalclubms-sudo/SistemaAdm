import { Router } from 'express';
import { whatsappRoutes } from './whatsappRoutes';
import { leadsRoutes } from './leadsRoutes';
import { eventsRoutes } from './eventsRoutes';
import { productsRoutes } from './productsRoutes';
import { reservationsRoutes } from './reservationsRoutes';
import { webhookRoutes } from './webhookRoutes';
import { statsRoutes } from './statsRoutes';
import { configRoutes } from './configRoutes';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no auth required)
router.use('/whatsapp', whatsappRoutes);
router.use('/webhook', webhookRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Royal Club WhatsApp Automation',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Documentation
router.get('/docs', (req, res) => {
  res.json({
    title: 'Royal Club WhatsApp Automation API',
    version: '2.0.0',
    description: 'API for managing WhatsApp sales automation for Royal Club events',
    endpoints: {
      whatsapp: {
        'GET /api/whatsapp/status': 'Get WhatsApp connection status',
        'GET /api/whatsapp/qr': 'Get QR code for connection',
        'POST /api/whatsapp/send': 'Send message (requires auth)',
        'POST /api/whatsapp/broadcast': 'Send broadcast message (requires auth)'
      },
      leads: {
        'GET /api/leads': 'List all leads (requires auth)',
        'GET /api/leads/:id': 'Get lead by ID (requires auth)',
        'POST /api/leads': 'Create new lead (requires auth)',
        'PUT /api/leads/:id': 'Update lead (requires auth)',
        'DELETE /api/leads/:id': 'Delete lead (requires auth)'
      },
      events: {
        'GET /api/events': 'List all events',
        'GET /api/events/:id': 'Get event by ID',
        'POST /api/events': 'Create new event (requires auth)',
        'PUT /api/events/:id': 'Update event (requires auth)',
        'DELETE /api/events/:id': 'Delete event (requires auth)'
      },
      products: {
        'GET /api/products': 'List all products',
        'GET /api/products/:id': 'Get product by ID',
        'POST /api/products': 'Create new product (requires auth)',
        'PUT /api/products/:id': 'Update product (requires auth)',
        'DELETE /api/products/:id': 'Delete product (requires auth)'
      },
      reservations: {
        'GET /api/reservations': 'List reservations (requires auth)',
        'GET /api/reservations/:id': 'Get reservation by ID (requires auth)',
        'POST /api/reservations': 'Create new reservation',
        'PUT /api/reservations/:id': 'Update reservation (requires auth)',
        'DELETE /api/reservations/:id': 'Cancel reservation (requires auth)'
      },
      stats: {
        'GET /api/stats/leads': 'Get lead statistics (requires auth)',
        'GET /api/stats/reservations': 'Get reservation statistics (requires auth)',
        'GET /api/stats/revenue': 'Get revenue statistics (requires auth)'
      },
      webhooks: {
        'POST /api/webhook/stripe': 'Stripe payment webhook',
        'POST /api/webhook/pix': 'PIX payment webhook'
      }
    },
    authentication: {
      method: 'API Key',
      header: 'X-API-Key',
      description: 'Include your API key in the X-API-Key header for protected endpoints'
    }
  });
});

// Protected routes (require authentication)
router.use('/leads', authMiddleware, leadsRoutes);
router.use('/events', authMiddleware, eventsRoutes);
router.use('/products', authMiddleware, productsRoutes);
router.use('/reservations', authMiddleware, reservationsRoutes);
router.use('/stats', authMiddleware, statsRoutes);
router.use('/config', authMiddleware, configRoutes);

// Error handling
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist',
    availableEndpoints: '/api/docs'
  });
});

export { router as apiRoutes };
