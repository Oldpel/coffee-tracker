import express from 'express';
import cors from 'cors';
import path from 'path';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const app = express();
app.use(cors()); // Allow all origins for simplicity in this MVP, or configure it explicitly

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

// Serve frontend in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get(/(.*)/, (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, async () => {
  await ensureTestUser();
  console.log(`Server listening on port ${PORT}`);
});
