const winston = require('winston');

/**
 * Usage in a service:
 *   const { createLogger } = require('@feastfleet/shared');
 *   const logger = createLogger('auth-service');
 *   logger.info('Server started', { port: 3001 });
 */
const createLogger = (serviceName) => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format:
          process.env.NODE_ENV === 'development'
            ? winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                  return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
                })
              )
            : winston.format.json(),
      }),
    ],
  });

  return logger;
};

module.exports = { createLogger };
