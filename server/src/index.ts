import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));

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

app.listen(PORT, async () => {
  await ensureTestUser();
  console.log(`Server listening on port ${PORT}`);
});
