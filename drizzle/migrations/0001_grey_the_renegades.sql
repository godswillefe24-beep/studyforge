CREATE TABLE `questionOptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`questionId` integer NOT NULL,
	`optionIndex` integer NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `question_options_question_idx` ON `questionOptions` (`questionId`,`optionIndex`);