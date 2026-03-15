-- Run this in MySQL (Workbench, command line, or any MySQL client) when the migration tool cannot connect.
-- Use the database first: USE passmartshop;

-- 1. Update paymentStatus enum to include new values
ALTER TABLE `orders` MODIFY COLUMN `paymentStatus` enum('pending','awaiting_verification','completed','failed','refunded') DEFAULT 'pending';

-- 2. Add payment columns (ignore error if they already exist)
ALTER TABLE `orders` ADD COLUMN `paymentMethod` varchar(32) NULL;
ALTER TABLE `orders` ADD COLUMN `mpesaTransactionCode` varchar(64) NULL;

-- 3. Add imagesLow to products if missing (ignore error if exists)
ALTER TABLE `products` ADD COLUMN `imagesLow` json NULL;
