CREATE TABLE `material_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`materialId` int NOT NULL,
	`type` enum('extract','index') NOT NULL DEFAULT 'extract',
	`job_status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`attempts` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `material_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `materials` MODIFY COLUMN `status` enum('queued','extracting','indexing','indexed','needs_review','failed') NOT NULL DEFAULT 'queued';--> statement-breakpoint
ALTER TABLE `materials` ADD `mimeType` varchar(120);--> statement-breakpoint
ALTER TABLE `materials` ADD `contentHash` varchar(64);--> statement-breakpoint
ALTER TABLE `materials` ADD `pageCount` int;--> statement-breakpoint
ALTER TABLE `materials` ADD `detectedLanguage` varchar(12);--> statement-breakpoint
ALTER TABLE `materials` ADD `errorCode` varchar(64);--> statement-breakpoint
ALTER TABLE `materials` ADD `errorMessage` text;--> statement-breakpoint
ALTER TABLE `materials` ADD `processedAt` timestamp;--> statement-breakpoint
CREATE INDEX `material_jobs_user_idx` ON `material_jobs` (`userId`);--> statement-breakpoint
CREATE INDEX `material_jobs_material_idx` ON `material_jobs` (`materialId`);