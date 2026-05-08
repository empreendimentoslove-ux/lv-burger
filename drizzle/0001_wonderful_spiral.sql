CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`imageUrl` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`motoboyId` int,
	`status` enum('waiting','accepted','in_route','delivered') NOT NULL DEFAULT 'waiting',
	`acceptedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveries_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(200) NOT NULL,
	`productPrice` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL,
	`notes` text,
	`subtotal` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(20) NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending_payment','confirmed','preparing','ready','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'pending_payment',
	`paymentMethod` enum('cash','pix') NOT NULL,
	`paymentStatus` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
	`changeAmount` decimal(10,2),
	`pixProofUrl` text,
	`deliveryAddress` text NOT NULL,
	`deliveryCode` varchar(6) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`deliveryFee` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`notes` text,
	`estimatedDelivery` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `product_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`stockItemId` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	CONSTRAINT `product_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`imageUrl` text,
	`active` boolean NOT NULL DEFAULT true,
	`blocked` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`unit` varchar(20) NOT NULL DEFAULT 'un',
	`quantity` decimal(10,2) NOT NULL DEFAULT '0',
	`minQuantity` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('customer','motoboy','admin') NOT NULL DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;