import { router } from '../trpc';
import { beansRouter } from './beans';
import { recordsRouter } from './records';
import { communityRouter } from './community';
import { authRouter } from './auth';

export const appRouter = router({
  beans: beansRouter,
  records: recordsRouter,
  community: communityRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
