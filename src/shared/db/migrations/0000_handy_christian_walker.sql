CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`file_name` text NOT NULL,
	`language` text NOT NULL,
	`cover_path` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`language`) REFERENCES `languages`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `books_language_idx` ON `books` (`language`);--> statement-breakpoint
CREATE TABLE `languages` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reading_progress` (
	`book_id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`token_index` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`index` integer NOT NULL,
	`title` text,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`index` integer NOT NULL,
	`type` text NOT NULL,
	`text` text NOT NULL,
	`word_key` text,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tokens_section_idx` ON `tokens` (`section_id`,`index`);--> statement-breakpoint
CREATE TABLE `vocabulary` (
	`word_key` text NOT NULL,
	`language` text NOT NULL,
	`status` integer DEFAULT 0 NOT NULL,
	`translation` text,
	`notes` text,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`word_key`, `language`),
	FOREIGN KEY (`language`) REFERENCES `languages`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vocabulary_language_idx` ON `vocabulary` (`language`);