import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.WA_LOG_LEVEL || 'info';

export const logger = pino({
  level: logLevel,
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
      errorLikeObjectKeys: ['err', 'error']
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  },
  redact: {
    paths: [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'creditCard',
      'cvv',
      'cpf',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.apiKey',
      '*.secret',
      '*.creditCard',
      '*.cvv',
      '*.cpf'
    ],
    censor: '***REDACTED***'
  }
});

// Helper functions for common log patterns
export const logWhatsAppMessage = (direction: 'incoming' | 'outgoing', from: string, to: string, message: string) => {
  logger.info('WhatsApp Message', {
    direction,
    from: from.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
    to: to.replace(/\d(?=\d{4})/g, '*'),
    messageLength: message.length,
    timestamp: new Date().toISOString()
  });
};

export const logSalesEvent = (event: string, leadId: string, data?: any) => {
  logger.info('Sales Event', {
    event,
    leadId,
    data,
    timestamp: new Date().toISOString()
  });
};

export const logPaymentEvent = (event: string, reservationId: string, amount?: number, data?: any) => {
  logger.info('Payment Event', {
    event,
    reservationId,
    amount,
    data,
    timestamp: new Date().toISOString()
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    timestamp: new Date().toISOString()
  });
};
