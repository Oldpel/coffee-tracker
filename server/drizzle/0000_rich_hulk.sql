CREATE TABLE `brewing_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`beanId` integer NOT NULL,
	`userId` integer NOT NULL,
	`brewDate` text NOT NULL,
	`brewMethod` text,
	`waterTemperature` integer,
	`grindSize` text,
	`coffeeAmount` integer,
	`waterAmount` integer,
	`brewTime` integer,
	`tasteRating` integer,
	`notes` text,
	`curveData` text,
	`isDeleted` integer DEFAULT false,
	`createdAt` text DEFAULT '2026-06-21T01:42:23.934Z' NOT NULL,
	`updatedAt` text DEFAULT '2026-06-21T01:42:23.934Z' NOT NULL,
	FOREIGN KEY (`beanId`) REFERENCES `coffee_beans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `coffee_beans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`origin` text,
	`processingMethod` text,
	`roastLevel` text,
	`purchaseDate` text NOT NULL,
	`notes` text,
	`isDeleted` integer DEFAULT false,
	`createdAt` text DEFAULT '2026-06-21T01:42:23.934Z' NOT NULL,
	`updatedAt` text DEFAULT '2026-06-21T01:42:23.934Z' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`postId` integer NOT NULL,
	`userId` integer NOT NULL,
	`content` text NOT NULL,
	`rootCommentId` integer,
	`replyToUserId` integer,
	`status` text DEFAULT 'pending',
	`isDeleted` integer DEFAULT false,
	`likeCount` integer DEFAULT 0,
	`createdAt` text DEFAULT '2026-06-21T01:42:23.935Z' NOT NULL,
	`updatedAt` text DEFAULT '2026-06-21T01:42:23.935Z' NOT NULL,
	FOREIGN KEY (`postId`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`category` text,
	`relatedBeanId` integer,
	`status` text DEFAULT 'pending',
	`viewCount` integer DEFAULT 0,
	`likeCount` integer DEFAULT 0,
	`commentCount` integer DEFAULT 0,
	`createdAt` text DEFAULT '2026-06-21T01:42:23.935Z' NOT NULL,
	`updatedAt` text DEFAULT '2026-06-21T01:42:23.935Z' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`relatedBeanId`) REFERENCES `coffee_beans`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user',
	`createdAt` text DEFAULT '2026-06-21T01:42:23.933Z' NOT NULL,
	`updatedAt` text DEFAULT '2026-06-21T01:42:23.934Z' NOT NULL,
	`lastSignedIn` text DEFAULT '2026-06-21T01:42:23.934Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);