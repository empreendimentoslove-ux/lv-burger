CREATE TABLE `company_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL DEFAULT 'LV BURGER',
	`logoUrl` text,
	`description` text,
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_info_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text,
	`discountPercentage` int,
	`discountValue` decimal(10,2),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`)
);
