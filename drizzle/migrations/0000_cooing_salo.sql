CREATE TABLE `attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` integer NOT NULL,
	`questionId` integer NOT NULL,
	`userId` integer NOT NULL,
	`selectedIndex` integer NOT NULL,
	`isCorrect` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `practiceSessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`tier` text DEFAULT 'free' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exams_code_unique` ON `exams` (`code`);--> statement-breakpoint
CREATE TABLE `practiceSessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`mode` text DEFAULT 'practice' NOT NULL,
	`topicId` integer,
	`startedAt` integer NOT NULL,
	`completedAt` integer,
	`score` integer,
	`total` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topicId`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topicId` integer NOT NULL,
	`prompt` text NOT NULL,
	`optionsJson` text NOT NULL,
	`answerIndex` integer NOT NULL,
	`explanation` text,
	`difficulty` text DEFAULT 'medium' NOT NULL,
	FOREIGN KEY (`topicId`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`examId` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_exam_slug_idx` ON `subjects` (`examId`,`slug`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`provider` text DEFAULT 'paystack' NOT NULL,
	`reference` text,
	`status` text DEFAULT 'free' NOT NULL,
	`planCode` text DEFAULT 'studyforge_plus_monthly' NOT NULL,
	`amountKobo` integer DEFAULT 0 NOT NULL,
	`currentPeriodEnd` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_user_idx` ON `subscriptions` (`userId`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subjectId` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_subject_slug_idx` ON `topics` (`subjectId`,`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`passwordHash` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);