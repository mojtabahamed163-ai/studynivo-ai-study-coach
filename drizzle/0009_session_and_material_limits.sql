ALTER TABLE `materials` MODIFY COLUMN `textContent` mediumtext;--> statement-breakpoint
ALTER TABLE `users` ADD `sessionVersion` int DEFAULT 0 NOT NULL;