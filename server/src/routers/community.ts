import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Community feature is temporarily offline for security maintenance
const maintenanceError = () => {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: '社区功能正在维护升级中，暂时无法使用。',
  });
};

export const communityRouter = router({
  listPosts: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async () => {
      maintenanceError();
    }),

  createPost: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.string(),
      relatedBeanId: z.number().optional()
    }))
    .mutation(async () => {
      maintenanceError();
    }),

  addComment: protectedProcedure
    .input(z.object({
      postId: z.number(),
      content: z.string().min(1),
      parentCommentId: z.number().nullable().optional()
    }))
    .mutation(async () => {
      maintenanceError();
    })
});
