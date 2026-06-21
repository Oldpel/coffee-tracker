import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { brewingRecords } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Papa from 'papaparse';

export const recordsRouter = router({
  listByBean: protectedProcedure
    .input(z.object({ beanId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.select().from(brewingRecords)
        .where(
          and(
            eq(brewingRecords.beanId, input.beanId),
            eq(brewingRecords.userId, ctx.user.id),
            eq(brewingRecords.isDeleted, false)
          )
        )
        .orderBy(desc(brewingRecords.brewDate));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const results = await db.select().from(brewingRecords)
        .where(
          and(
            eq(brewingRecords.id, input.id),
            eq(brewingRecords.userId, ctx.user.id),
            eq(brewingRecords.isDeleted, false)
          )
        );
      return results[0] || null;
    }),

  getRecent: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(brewingRecords)
      .where(
        and(
          eq(brewingRecords.userId, ctx.user.id),
          eq(brewingRecords.isDeleted, false)
        )
      )
      .orderBy(desc(brewingRecords.brewDate))
      .limit(20);
  }),

  create: protectedProcedure
    .input(z.object({
      beanId: z.number(),
      brewDate: z.string(),
      brewMethod: z.string().optional(),
      waterTemperature: z.number().optional(),
      grindSize: z.string().optional(),
      coffeeAmount: z.number().optional(),
      waterAmount: z.number().optional(),
      brewTime: z.number().optional(),
      tasteRating: z.number().min(1).max(10).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(brewingRecords).values({
        ...input,
        userId: ctx.user.id,
      }).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      tasteRating: z.number().min(1).max(10).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const result = await db.update(brewingRecords)
        .set({ ...updateData, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(brewingRecords.id, id),
            eq(brewingRecords.userId, ctx.user.id)
          )
        ).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(brewingRecords)
        .set({ isDeleted: true, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(brewingRecords.id, input.id),
            eq(brewingRecords.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  uploadCurve: protectedProcedure
    .input(z.object({
      id: z.number(),
      csvData: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      
      const parsed = Papa.parse(input.csvData, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new Error('CSV parsing failed');
      }

      // Find the correct keys for Time and Weight (case-insensitive and partial match)
      const headers = parsed.meta.fields || [];
      const timeKey = headers.find(h => h.toLowerCase().includes('time')) || headers[0];
      const weightKey = headers.find(h => h.toLowerCase().includes('weight') || h.toLowerCase().includes('scale')) || headers[1];

      if (!timeKey || !weightKey) {
        throw new Error('Could not find Time and Weight columns in CSV');
      }

      const curvePoints: Array<{ time: number, weight: number, flow: number }> = [];
      let lastSavedTime = -1;

      for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i] as any;
        const time = parseFloat(row[timeKey]);
        const weight = parseFloat(row[weightKey]);

        if (isNaN(time) || isNaN(weight)) continue;

        // Downsample: Keep one point every 0.5 seconds or the very last point
        if (time - lastSavedTime >= 0.5 || i === parsed.data.length - 1) {
          let flow = 0;
          if (curvePoints.length > 0) {
            const lastPoint = curvePoints[curvePoints.length - 1];
            const deltaTime = time - lastPoint.time;
            const deltaWeight = weight - lastPoint.weight;
            if (deltaTime > 0) {
              flow = deltaWeight / deltaTime;
            }
          }

          curvePoints.push({
            time: parseFloat(time.toFixed(1)),
            weight: parseFloat(weight.toFixed(2)),
            flow: Math.max(0, parseFloat(flow.toFixed(2)))
          });

          lastSavedTime = time;
        }
      }

      const curveDataJson = JSON.stringify(curvePoints);

      await db.update(brewingRecords)
        .set({ curveData: curveDataJson, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(brewingRecords.id, input.id),
            eq(brewingRecords.userId, ctx.user.id)
          )
        );

      return { success: true, pointsCount: curvePoints.length };
    })
});
