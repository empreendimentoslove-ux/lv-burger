CREATE TABLE `shop_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`isOpen` boolean NOT NULL DEFAULT true,
	`openTime` varchar(5) NOT NULL DEFAULT '17:00',
	`closeTime` varchar(5) NOT NULL DEFAULT '00:00',
	`operatingDays` varchar(20) NOT NULL DEFAULT '1,2,3,4,5,6',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_settings_id` PRIMARY KEY(`id`)
);
