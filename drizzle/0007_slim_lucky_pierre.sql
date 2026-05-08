CREATE TABLE `delivery_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`minDistance` decimal(10,2) NOT NULL,
	`maxDistance` decimal(10,2) NOT NULL,
	`baseFee` decimal(10,2) NOT NULL,
	`perKmFee` decimal(10,2) NOT NULL,
	`estimatedMinutes` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delivery_zones_id` PRIMARY KEY(`id`)
);
