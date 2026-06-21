import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  openId: text('openId').notNull().unique(), // Will be used to store email for backward compatibility / unique constraint
  name: text('name'),
  email: text('email'),
  passwordHash: text('passwordHash'), // New field for traditional auth
  loginMethod: text('loginMethod'),
  role: text('role').default('user'),
  createdAt: text('createdAt').notNull().default(new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().default(new Date().toISOString()),
  lastSignedIn: text('lastSignedIn').notNull().default(new Date().toISOString()),
});

export const coffeeBeans = sqliteTable('coffee_beans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  origin: text('origin'),
  processingMethod: text('processingMethod'),
  roastLevel: text('roastLevel'),
  purchaseDate: text('purchaseDate').notNull(),
  notes: text('notes'),
  isDeleted: integer('isDeleted', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt').notNull().default(new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().default(new Date().toISOString()),
});

export const brewingRecords = sqliteTable('brewing_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  beanId: integer('beanId').notNull().references(() => coffeeBeans.id, { onDelete: 'cascade' }),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  brewDate: text('brewDate').notNull(),
  brewMethod: text('brewMethod'),
  waterTemperature: integer('waterTemperature'),
  grindSize: text('grindSize'),
  coffeeAmount: integer('coffeeAmount'),
  waterAmount: integer('waterAmount'),
  brewTime: integer('brewTime'),
  tasteRating: integer('tasteRating'),
  notes: text('notes'),
  curveData: text('curveData'), // Store JSON string of curve time-series
  isDeleted: integer('isDeleted', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt').notNull().default(new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().default(new Date().toISOString()),
}, (table) => ({
  beanIdx: index('idx_brewing_records_beanId').on(table.beanId),
  userIdx: index('idx_brewing_records_userId').on(table.userId),
}));

export const communityPosts = sqliteTable('community_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category'),
  relatedBeanId: integer('relatedBeanId').references(() => coffeeBeans.id, { onDelete: 'set null' }),
  status: text('status').default('pending'),
  viewCount: integer('viewCount').default(0),
  likeCount: integer('likeCount').default(0),
  commentCount: integer('commentCount').default(0),
  createdAt: text('createdAt').notNull().default(new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().default(new Date().toISOString()),
});

export const communityComments = sqliteTable('community_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('postId').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  rootCommentId: integer('rootCommentId'), // SQLite requires special handling for self-referential relations, but simple int is fine
  replyToUserId: integer('replyToUserId'),
  status: text('status').default('pending'),
  isDeleted: integer('isDeleted', { mode: 'boolean' }).default(false),
  likeCount: integer('likeCount').default(0),
  createdAt: text('createdAt').notNull().default(new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().default(new Date().toISOString()),
});
