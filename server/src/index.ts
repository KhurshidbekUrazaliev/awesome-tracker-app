import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { isDbReachable } from './db/client';
import { logger } from './logger';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import listingRoutes from './routes/listings';
import reviewRoutes from './routes/reviews';
import safetyRoutes from './routes/safety';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/users';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8081')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed`));
      }
    },
  })
);
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/api/health' },
  })
);
app.use(express.json({ limit: '1mb' }));

// Auth endpoints are the highest-value brute-force target; rate-limit them specifically.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// A generous baseline limit for everything else, mainly to blunt accidental retry storms.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/ready', async (_req, res) => {
  if (!(await isDbReachable())) {
    return res.status(503).json({ status: 'not ready', reason: 'database is not reachable' });
  }
  res.json({ status: 'ready' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/safety', safetyRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log?.error({ err }, 'Unhandled request error');
  res.status(500).json({ message: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  logger.info(`API server listening on http://localhost:${PORT}`);
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
