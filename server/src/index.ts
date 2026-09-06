import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { isDbReachable } from './db/client';
import { closeExpiredAuctions } from './db/listingsRepo';
import { getPushToken } from './db/usersRepo';
import { logger } from './logger';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import listingRoutes from './routes/listings';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import roomRoutes from './routes/rooms';
import safetyRoutes from './routes/safety';
import stripeWebhookRoutes from './routes/stripeWebhook';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/users';
import { sendPushNotification } from './utils/pushNotifications';

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
// Stripe webhook signature verification needs the raw request body, not the
// JSON-parsed one — this must be mounted (and thus matched) before the global
// express.json() below, which would otherwise consume the body first.
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

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
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);

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

// Best-effort sweep for auctions past their deadline — see closeAuctionIfExpired
// in listingsRepo.ts for the lazy on-read fallback that covers correctness
// when this instance was asleep (Render free tier) and missed ticks; nothing
// can bid on or win an auction after its deadline regardless, so a missed
// tick only delays the winner/owner notification, never breaks correctness.
let isClosingAuctions = false;
const auctionCloseInterval = setInterval(async () => {
  if (isClosingAuctions) return;
  isClosingAuctions = true;
  try {
    const closed = await closeExpiredAuctions();
    for (const auction of closed) {
      if (auction.winnerId) {
        sendPushNotification(
          await getPushToken(auction.winnerId),
          'You won the auction!',
          `You won "${auction.title}" — pay now to claim it.`,
          { listingId: auction.listingId }
        );
        sendPushNotification(
          await getPushToken(auction.ownerId),
          'Your auction closed',
          `"${auction.title}" closed with a winning bidder.`,
          { listingId: auction.listingId }
        );
      } else {
        sendPushNotification(
          await getPushToken(auction.ownerId),
          'Your auction closed',
          `"${auction.title}" closed with no bids.`,
          { listingId: auction.listingId }
        );
      }
    }
  } catch (err) {
    logger.error({ err }, 'Failed to close expired auctions');
  } finally {
    isClosingAuctions = false;
  }
}, 60_000).unref();

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  clearInterval(auctionCloseInterval);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
