CREATE TABLE `break_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`max_consecutive_hours` real DEFAULT 6 NOT NULL,
	`warn_before_required_minutes` integer DEFAULT 30 NOT NULL,
	`auto_enforce_breaks` integer DEFAULT true NOT NULL,
	`allow_skip_break` integer DEFAULT false NOT NULL,
	`require_manager_override` integer DEFAULT false NOT NULL,
	`min_staff_for_break` integer DEFAULT 1,
	`is_active` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `break_policies_business_idx` ON `break_policies` (`business_id`);--> statement-breakpoint
CREATE INDEX `break_policies_active_idx` ON `break_policies` (`is_active`);--> statement-breakpoint
CREATE INDEX `break_policies_default_idx` ON `break_policies` (`is_default`);--> statement-breakpoint
CREATE TABLE `break_policy_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`policy_id` integer NOT NULL,
	`break_type_id` integer NOT NULL,
	`min_shift_hours` real NOT NULL,
	`max_shift_hours` real,
	`allowed_count` integer DEFAULT 1 NOT NULL,
	`is_mandatory` integer DEFAULT false NOT NULL,
	`earliest_after_hours` real,
	`latest_before_end_hours` real,
	`priority` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`policy_id`) REFERENCES `break_policies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`break_type_id`) REFERENCES `break_type_definitions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `break_policy_rules_policy_idx` ON `break_policy_rules` (`policy_id`);--> statement-breakpoint
CREATE INDEX `break_policy_rules_type_idx` ON `break_policy_rules` (`break_type_id`);--> statement-breakpoint
CREATE INDEX `break_policy_rules_shift_hours_idx` ON `break_policy_rules` (`min_shift_hours`);--> statement-breakpoint
CREATE TABLE `break_type_definitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`default_duration_minutes` integer DEFAULT 15 NOT NULL,
	`min_duration_minutes` integer DEFAULT 5 NOT NULL,
	`max_duration_minutes` integer DEFAULT 60 NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`is_required` integer DEFAULT false NOT NULL,
	`counts_as_worked_time` integer DEFAULT false NOT NULL,
	`allowed_window_start` text,
	`allowed_window_end` text,
	`icon` text DEFAULT 'coffee',
	`color` text DEFAULT '#6B7280',
	`sort_order` integer DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `break_type_defs_business_idx` ON `break_type_definitions` (`business_id`);--> statement-breakpoint
CREATE INDEX `break_type_defs_code_idx` ON `break_type_definitions` (`code`);--> statement-breakpoint
CREATE INDEX `break_type_defs_active_idx` ON `break_type_definitions` (`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `break_type_defs_business_code_unique` ON `break_type_definitions` (`business_id`,`code`);