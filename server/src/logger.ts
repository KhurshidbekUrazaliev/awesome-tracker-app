import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

// Emits plain structured JSON. In dev, pipe through pino-pretty at the shell
// level instead of pino's worker-thread transport, which doesn't resolve
// reliably under tsx/ts-node.
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
});
