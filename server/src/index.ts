import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit, { type Options as RateLimitOptions } from 'express-rate-limit';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const app = express();

// #7: Hide X-Powered-By header to prevent tech stack fingerprinting
app.disable('x-powered-by');

// Trust proxy for Cloudflare (needed for rate limiting to get real IP)
app.set('trust proxy', 1);

// #3: Security HTTP headers middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// #4: Restrict CORS to allowed origins only (no more wildcard *)
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://svcoffee.xyz', 'https://www.svcoffee.xyz']
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// #6: Rate limiting for auth endpoints (5 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  // Return tRPC compatible error format
  handler: (req, res) => {
    res.status(429).json([{
      error: {
        message: '请求过于频繁，请稍后再试',
        code: -32001,
        data: { code: 'TOO_MANY_REQUESTS', httpStatus: 429 }
      }
    }]);
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use Cloudflare's real IP header when available, fall back to req.ip
  keyGenerator: (req) => {
    return (req.headers['cf-connecting-ip'] as string) || req.ip || '127.0.0.1';
  },
  validate: { ip: false, keyGeneratorIpFallback: false },
});

// General API rate limit (100 requests per minute)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  // Return tRPC compatible error format
  handler: (req, res) => {
    res.status(429).json([{
      error: {
        message: 'API请求过于频繁，请稍后再试',
        code: -32001,
        data: { code: 'TOO_MANY_REQUESTS', httpStatus: 429 }
      }
    }]);
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req.headers['cf-connecting-ip'] as string) || req.ip || '127.0.0.1';
  },
  validate: { ip: false, keyGeneratorIpFallback: false },
});

app.use('/api/trpc/auth.login', authLimiter);
app.use('/api/trpc/auth.register', authLimiter);
app.use('/api/trpc', apiLimiter);

// Ensure a test user exists for MVP testing
async function ensureTestUser() {
  const existingUser = await db.select().from(users).where(eq(users.id, 1));
  if (existingUser.length === 0) {
    await db.insert(users).values({
      openId: 'test-user-id',
      name: '测试用户',
      email: 'test@example.com',
      loginMethod: 'mock',
      role: 'user'
    });
    console.log('Test user created');
  }
}

app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

const PORT = process.env.PORT || 3000;

// Serve frontend in production with strict cache control
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath, {
  setHeaders: (res, pathStr) => {
    if (pathStr.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// #9: Block sensitive paths before SPA fallback
const sensitivePaths = [
  '/.env', '/.env.local', '/.env.production',
  '/.git', '/.ssh',
  '/wp-admin', '/wp-login.php', '/phpmyadmin',
  '/admin/config', '/config.json',
  '/package.json', '/yarn.lock', '/pnpm-lock.yaml',
];

app.get(/(.*)/, (req, res) => {
  // Return 404 for API routes not matched
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });

  // #9: Return 404 for sensitive paths
  const lowerPath = req.path.toLowerCase();
  if (sensitivePaths.some(p => lowerPath.startsWith(p))) {
    return res.status(404).send('Not Found');
  }

  // SPA fallback
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global error handler - prevent stack traces from leaking
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err); // Log to server only
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, async () => {
  await ensureTestUser();
  console.log(`Server listening on port ${PORT}`);
});
