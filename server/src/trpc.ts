import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'coffee-secret-key-2026';

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  const authHeader = req.headers.authorization;
  let user: { id: number, role: string, name?: string } | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      user = {
        id: parseInt(decoded.sub, 10),
        role: decoded.role,
        name: decoded.name
      };
    } catch (e) {
      // Invalid token
    }
  }

  return {
    req,
    res,
    user
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // asserts user is not null
    },
  });
});
