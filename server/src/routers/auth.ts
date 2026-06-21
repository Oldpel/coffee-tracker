import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// MVP Secret. In production, use environment variables!
const JWT_SECRET = process.env.JWT_SECRET || 'coffee-secret-key-2026';

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(8, '密码至少8位'), // Receives client-side SHA-256 hash
      name: z.string().min(1, '昵称不能为空')
    }))
    .mutation(async ({ input }) => {
      const bcrypt = await import('bcryptjs');
      
      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.openId, input.email) // email used as openId for backward compatibility
      });
      
      if (existingUser) {
        throw new Error('该邮箱已经被注册');
      }

      // Hash the incoming client-hashed password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(input.password, salt);

      const result = await db.insert(users).values({
        openId: input.email,
        email: input.email,
        name: input.name,
        passwordHash: hashedPassword,
        loginMethod: 'email'
      }).returning();
      
      const user = result[0];

      // Issue JWT
      const token = jwt.sign({
        sub: user.id.toString(),
        role: user.role,
        name: user.name
      }, JWT_SECRET, { expiresIn: '7d' });

      return {
        token,
        user: { id: user.id, name: user.name, role: user.role }
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string() // Receives client-side SHA-256 hash
    }))
    .mutation(async ({ input }) => {
      const bcrypt = await import('bcryptjs');

      const user = await db.query.users.findFirst({
        where: eq(users.openId, input.email)
      });

      if (!user || !user.passwordHash) {
        throw new Error('邮箱或密码错误');
      }

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        throw new Error('邮箱或密码错误');
      }

      const token = jwt.sign({
        sub: user.id.toString(),
        role: user.role,
        name: user.name
      }, JWT_SECRET, { expiresIn: '7d' });

      return {
        token,
        user: { id: user.id, name: user.name, role: user.role }
      };
    })
});
