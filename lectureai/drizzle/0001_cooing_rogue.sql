CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lectureId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lecture_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lectureId` int NOT NULL,
	`summary` text,
	`topics` json,
	`keyConcepts` json,
	`importantPoints` json,
	`assignments` json,
	`announcements` json,
	`questions` json,
	`importantDates` json,
	CONSTRAINT `lecture_analysis_id` PRIMARY KEY(`id`),
	CONSTRAINT `lecture_analysis_lectureId_unique` UNIQUE(`lectureId`)
);
--> statement-breakpoint
CREATE TABLE `lectures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subject` varchar(160),
	`professor` varchar(160),
	`lectureDate` timestamp,
	`duration` int,
	`fileUrl` text,
	`fileKey` text,
	`status` enum('uploading','processing','transcribing','analyzing','completed','failed') NOT NULL DEFAULT 'processing',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lectures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcript_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lectureId` int NOT NULL,
	`content` text NOT NULL,
	`startTime` int,
	`endTime` int,
	`embedding` json,
	CONSTRAINT `transcript_chunks_id` PRIMARY KEY(`id`)
);
