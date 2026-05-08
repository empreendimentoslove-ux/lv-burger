CREATE TABLE `daily_sales_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(12,2) NOT NULL DEFAULT '0',
	`totalDeliveryFees` decimal(12,2) NOT NULL DEFAULT '0',
	`averageOrderValue` decimal(12,2) NOT NULL DEFAULT '0',
	`paymentMethods` json NOT NULL DEFAULT ('{}'),
	`orderStatuses` json NOT NULL DEFAULT ('{}'),
	`topProducts` json NOT NULL DEFAULT ('[]'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_sales_reports_id` PRIMARY KEY(`id`)
);
