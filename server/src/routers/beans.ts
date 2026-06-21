import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { coffeeBeans } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const beansRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(coffeeBeans)
      .where(
        and(
          eq(coffeeBeans.userId, ctx.user.id),
          eq(coffeeBeans.isDeleted, false)
        )
      );
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const results = await db.select().from(coffeeBeans)
        .where(
          and(
            eq(coffeeBeans.id, input.id),
            eq(coffeeBeans.userId, ctx.user.id),
            eq(coffeeBeans.isDeleted, false)
          )
        );
      return results[0] || null;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "豆子名称不能为空"),
      origin: z.string().optional(),
      processingMethod: z.string().optional(),
      roastLevel: z.string().optional(),
      purchaseDate: z.string(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(coffeeBeans).values({
        ...input,
        userId: ctx.user.id,
      }).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      origin: z.string().optional(),
      processingMethod: z.string().optional(),
      roastLevel: z.string().optional(),
      purchaseDate: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const result = await db.update(coffeeBeans)
        .set({ ...updateData, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(coffeeBeans.id, id),
            eq(coffeeBeans.userId, ctx.user.id)
          )
        ).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(coffeeBeans)
        .set({ isDeleted: true, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(coffeeBeans.id, input.id),
            eq(coffeeBeans.userId, ctx.user.id)
          )
        );
      return { success: true };
    })
});
