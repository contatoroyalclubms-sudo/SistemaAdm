require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const WhatsAppService = require('./services/whatsapp');
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
    this.whatsapp = null;
    this.redis = null;
  }

  async initialize() {
    try {
      // Conectar Redis (com fallback)
      this.redis = new RedisService();
      await this.redis.connect();
      if (this.redis.fallbackMode) {
        this.logger.warn('⚠️  Redis não disponível - usando armazenamento em memória local');
        this.redis.startCleanupInterval();
      } else {
        this.logger.info('Redis connected successfully');
      }

      // Middleware e rotas primeiro, para servidor subir já
      this.setupMiddleware();
      setupRoutes(this.app, this.whatsapp, this.redis, this.logger);

      // Iniciar servidor HTTP imediatamente
      this.app.listen(this.port, () => {
        this.logger.info(`🚀 Royal Club WhatsApp Bot running on port ${this.port}`);
        this.logger.info(`📱 Club: ${process.env.CLUB_NAME}`);
        this.logger.info(`⚡ Rate limit: ${process.env.RATE_LIMIT_MSGS_PER_MIN} msgs/min`);
      });

      // Inicializar WhatsApp em segundo plano, sem bloquear a API
      (async () => {
        try {
          this.whatsapp = new WhatsAppService(this.redis, this.logger);
          await this.whatsapp.initialize();
          this.logger.info('WhatsApp service initialized');
        } catch (waError) {
          this.logger.warn('WhatsApp init failed, API is running without WA connection:', waError.message);
          this.whatsapp = null;
        }
      })();

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
  if (bot.whatsapp) {
    await bot.whatsapp.disconnect();
  }
  if (bot.redis) {
    await bot.redis.disconnect();
  }
  process.exit(0);
});
