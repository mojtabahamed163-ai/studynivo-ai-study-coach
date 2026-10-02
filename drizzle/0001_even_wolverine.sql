CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`status` enum('queued','indexed','needs_review') NOT NULL DEFAULT 'queued',
	`storageKey` varchar(512),
	`sizeBytes` int,
	`textContent` text,
	`sourceRef` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`excerpt` text,
	`sourceRef` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int NOT NULL,
	`topicId` int,
	`durationMinutes` int NOT NULL,
	`elapsedSeconds` int NOT NULL DEFAULT 0,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `study_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`color` varchar(16) NOT NULL DEFAULT '#0f766e',
	`examDate` date,
	`mastery` int NOT NULL DEFAULT 0,
	`minutesStudied` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`note` text,
	`sourceRef` varchar(255),
	`mastery` int NOT NULL DEFAULT 0,
	`isWeak` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`locale` varchar(12) NOT NULL DEFAULT 'en',
	`contentLanguage` varchar(12) NOT NULL DEFAULT 'en',
	`dailyGoalMinutes` int NOT NULL DEFAULT 60,
	`level` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `materials_subject_idx` ON `materials` (`userId`,`subjectId`);--> statement-breakpoint
CREATE INDEX `saved_items_user_idx` ON `saved_items` (`userId`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `study_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `sessions_subject_idx` ON `study_sessions` (`userId`,`subjectId`);--> statement-breakpoint
CREATE INDEX `subjects_user_idx` ON `subjects` (`userId`);--> statement-breakpoint
CREATE INDEX `subjects_user_slug_idx` ON `subjects` (`userId`,`slug`);--> statement-breakpoint
CREATE INDEX `topics_subject_idx` ON `topics` (`userId`,`subjectId`);--> statement-breakpoint
CREATE INDEX `user_profiles_user_idx` ON `user_profiles` (`userId`);