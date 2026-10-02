ALTER TABLE `material_jobs` MODIFY COLUMN `type` enum('extract','transcribe','index') NOT NULL DEFAULT 'extract';--> statement-breakpoint
ALTER TABLE `materials` ADD `audioDurationSeconds` int;--> statement-breakpoint
ALTER TABLE `materials` ADD `transcriptSegments` json;