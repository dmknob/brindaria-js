const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

// Garantir que a pasta de logs exista
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        new transports.File({ filename: path.join(logDir, 'combined.log') })
    ],
    exceptionHandlers: [
        new transports.File({ filename: path.join(logDir, 'exceptions.log') })
    ],
    rejectionHandlers: [
        new transports.File({ filename: path.join(logDir, 'rejections.log') })
    ]
});

// Em ambiente de desenvolvimento, também logar no console (legível)
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(format.colorize(), format.simple())
    }));
}

// Stream para morgan (rotas)
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Logger dedicado para assets (CSS, JS, imagens) — arquivo separado
const assetsLogger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
        new transports.File({ filename: path.join(logDir, 'assets.log') })
    ]
});

logger.assetsStream = {
    write: (message) => {
        assetsLogger.info(message.trim());
    }
};

// Captura rejeições não tratadas e exceções
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
});
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
    // Em muitos casos é seguro terminar o processo
    // process.exit(1);
});

module.exports = logger;
