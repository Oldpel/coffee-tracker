import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { db } from '../db';
import { communityPosts, communityComments, users } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const communityRouter = router({
  listPosts: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const posts = await db.select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        status: communityPosts.status,
        viewCount: communityPosts.viewCount,
        likeCount: communityPosts.likeCount,
        commentCount: communityPosts.commentCount,
        createdAt: communityPosts.createdAt,
        authorName: users.name
      }).from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .where(eq(communityPosts.status, 'published')) // MVP only return published
        .orderBy(desc(communityPosts.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);

      return {
        posts,
        page: input.page,
        pageSize: input.pageSize
      };
    }),

  createPost: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.string(),
      relatedBeanId: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Basic mock implementation. We will automatically set status to published for local dev
      const result = await db.insert(communityPosts).values({
        ...input,
        userId: ctx.user.id,
        status: 'published' // Should be 'pending' with real moderation
      }).returning();
      return result[0];
    }),

  addComment: protectedProcedure
    .input(z.object({
      postId: z.number(),
      content: z.string().min(1),
      parentCommentId: z.number().nullable().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(communityComments).values({
        postId: input.postId,
        userId: ctx.user.id,
        content: input.content,
        rootCommentId: input.parentCommentId || null,
        status: 'published'
      }).returning();
      
      // Increment comment count
      await db.update(communityPosts)
        .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
        .where(eq(communityPosts.id, input.postId));

      return result[0];
    })
});
