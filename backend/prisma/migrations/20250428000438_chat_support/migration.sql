-- DropForeignKey
ALTER TABLE `EventDay` DROP FOREIGN KEY `EventDay_eventChangeId_fkey`;

-- AddForeignKey
ALTER TABLE `EventDay` ADD CONSTRAINT `EventDay_eventChangeId_fkey` FOREIGN KEY (`eventChangeId`) REFERENCES `EventChange`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
