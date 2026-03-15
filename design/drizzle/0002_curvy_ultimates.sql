ALTER TABLE `orders` MODIFY COLUMN `paymentStatus` enum('pending','awaiting_verification','completed','failed','refunded') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` varchar(32);--> statement-breakpoint
ALTER TABLE `orders` ADD `mpesaTransactionCode` varchar(64);--> statement-breakpoint
ALTER TABLE `products` ADD `imagesLow` json;