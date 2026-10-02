ALTER TABLE `quiz_answers` ADD CONSTRAINT `quiz_answers_question_unique` UNIQUE(`userId`,`attemptId`,`questionIndex`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_phone_unique` UNIQUE(`phoneNumber`);