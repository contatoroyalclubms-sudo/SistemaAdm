import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@/shared/logger';
import { connectDatabase } from '@/infrastructure/database/prisma';
import { WhatsAppService } from '@/services/whatsapp';
import { apiRoutes } from '@/presentation/routes';
import { setWhatsAppDependencies } from '@/presentation/routes/whatsappRoutes';
import { rateLimitMiddleware } from '@/presentation/middleware/rateLimitMiddleware';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.API_CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
if (process.env.API_RATE_LIMIT_ENABLED === 'true') {
  app.use(rateLimitMiddleware);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api', apiRoutes);

// WhatsApp Service
let whatsappService: any;

async function initializeWhatsApp() {
  try {
    whatsappService = new WhatsAppService();
    
    logger.info('Initializing WhatsApp with Baileys...');
    await whatsappService.initialize();
    
    setWhatsAppDependencies(whatsappService, null);
    
    logger.info('✅ WhatsApp service initialized successfully with Baileys!');
    
  } catch (error) {
    logger.error('Failed to initialize WhatsApp service', { error });
    
    // Continue without WhatsApp in fallback mode
    logger.warn('Running in fallback mode without WhatsApp integration');
  }
}

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize WhatsApp
    await initializeWhatsApp();

    // Start HTTP server
    app.listen(port, () => {
      logger.info(`🎭 Royal Club WhatsApp Automation started!`, {
        port,
        environment: process.env.NODE_ENV,
        pid: process.pid
      });
      
      console.log(`\n🎭 ======================================`);
      console.log(`   ROYAL CLUB - WHATSAPP AUTOMATION`);
      console.log(`======================================`);
      console.log(`🚀 Server: http://localhost:${port}`);
      console.log(`📱 WhatsApp QR: http://localhost:${port}/api/whatsapp/qr`);
      console.log(`📊 API Docs: http://localhost:${port}/api/docs`);
      console.log(`❤️  Health: http://localhost:${port}/health`);
      console.log(`======================================\n`);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  if (whatsappService) {
    await whatsappService.close();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  if (whatsappService) {
    await whatsappService.close();
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the application
startServer();

export default app;
