CREATE TABLE `flashcards` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `subjectId` int NOT NULL,
  `topicId` int,
  `front` text NOT NULL,
  `back` text NOT NULL,
  `sourceRef` varchar(255),
  `difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `intervalDays` int NOT NULL DEFAULT 1,
  `mistakeCount` int NOT NULL DEFAULT 0,
  `confidence` enum('low','medium','high'),
  `lastReviewedAt` timestamp,
  `nextReviewAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `flashcards_id` PRIMARY KEY(`id`),
  INDEX `flashcards_user_subject_idx` (`userId`,`subjectId`),
  INDEX `flashcards_review_idx` (`userId`,`nextReviewAt`)
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `subjectId` int NOT NULL,
  `kind` enum('practice','mock') NOT NULL DEFAULT 'practice',
  `status` enum('active','completed') NOT NULL DEFAULT 'active',
  `questions` json NOT NULL,
  `score` int NOT NULL DEFAULT 0,
  `total` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` timestamp,
  CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`),
  INDEX `quiz_attempts_user_subject_idx` (`userId`,`subjectId`)
);
--> statement-breakpoint
CREATE TABLE `quiz_answers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `attemptId` int NOT NULL,
  `questionIndex` int NOT NULL,
  `answer` text,
  `confidence` enum('low','medium','high'),
  `isCorrect` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `quiz_answers_id` PRIMARY KEY(`id`),
  INDEX `quiz_answers_attempt_idx` (`userId`,`attemptId`)
);
