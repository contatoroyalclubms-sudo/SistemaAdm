require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const RedisService = require('./services/redis');
const { setupRoutes } = require('./routes');
const { rateLimiter } = require('./lib/rateLimiter');

const logger = pino({
  level: process.env.WA_LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});

class WhatsAppBot {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8080;
    this.logger = logger;
    this.redis = null;
  }

  async initialize() {
    try {
      // Inicializar Redis
      this.redis = new RedisService();
      await this.redis.connect();
      
      if (this.redis.fallbackMode) {
        this.logger.warn('⚠️  Redis não disponível - usando armazenamento em memória local');
        this.redis.startCleanupInterval();
      } else {
        this.logger.info('Redis connected successfully');
      }

      // Configurar middleware
      this.setupMiddleware();

      // Configurar rotas (sem WhatsApp por enquanto)
      setupRoutes(this.app, null, this.redis, this.logger);

      // Iniciar servidor
      this.app.listen(this.port, () => {
        this.logger.info(`🚀 Royal Club WhatsApp Bot running on port ${this.port}`);
        this.logger.info(`📱 Club: ${process.env.CLUB_NAME}`);
        this.logger.info(`⚡ Rate limit: ${process.env.RATE_LIMIT_MSGS_PER_MIN} msgs/min`);
        this.logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
      });

    } catch (error) {
      this.logger.error('Failed to initialize bot:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    if (process.env.API_CORS_ENABLED === 'true') {
      this.app.use(cors());
    }

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    if (process.env.API_RATE_LIMIT_ENABLED === 'true') {
      this.app.use('/api/', rateLimiter);
    }

    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`);
      next();
    });
  }
}

const bot = new WhatsAppBot();
bot.initialize().catch(console.error);

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (bot.redis) {
    await bot.redis.disconnect();
  }
  process.exit(0);
});
