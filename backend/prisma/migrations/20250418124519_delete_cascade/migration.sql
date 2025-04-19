-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_organizerId_fkey`;

-- DropForeignKey
ALTER TABLE `EventChange` DROP FOREIGN KEY `EventChange_eventDayId_fkey`;

-- DropForeignKey
ALTER TABLE `EventChangeImage` DROP FOREIGN KEY `EventChangeImage_eventChangeId_fkey`;

-- DropForeignKey
ALTER TABLE `EventDay` DROP FOREIGN KEY `EventDay_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `EventImage` DROP FOREIGN KEY `EventImage_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `EventModerator` DROP FOREIGN KEY `EventModerator_userId_fkey`;

-- DropForeignKey
ALTER TABLE `EventOccurrence` DROP FOREIGN KEY `EventOccurrence_eventChangeId_fkey`;

-- DropForeignKey
ALTER TABLE `EventOccurrence` DROP FOREIGN KEY `EventOccurrence_eventId_fkey`;

-- DropIndex
DROP INDEX `Event_organizerId_fkey` ON `Event`;

-- DropIndex
DROP INDEX `EventChange_eventDayId_fkey` ON `EventChange`;

-- DropIndex
DROP INDEX `EventChangeImage_eventChangeId_fkey` ON `EventChangeImage`;

-- DropIndex
DROP INDEX `EventDay_eventId_fkey` ON `EventDay`;

-- DropIndex
DROP INDEX `EventImage_eventId_fkey` ON `EventImage`;

-- DropIndex
DROP INDEX `EventModerator_userId_fkey` ON `EventModerator`;

-- DropIndex
DROP INDEX `EventOccurrence_eventChangeId_fkey` ON `EventOccurrence`;

-- DropIndex
DROP INDEX `EventOccurrence_eventId_fkey` ON `EventOccurrence`;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_organizerId_fkey` FOREIGN KEY (`organizerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventDay` ADD CONSTRAINT `EventDay_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventChange` ADD CONSTRAINT `EventChange_eventDayId_fkey` FOREIGN KEY (`eventDayId`) REFERENCES `EventDay`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventOccurrence` ADD CONSTRAINT `EventOccurrence_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventOccurrence` ADD CONSTRAINT `EventOccurrence_eventChangeId_fkey` FOREIGN KEY (`eventChangeId`) REFERENCES `EventChange`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventImage` ADD CONSTRAINT `EventImage_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventChangeImage` ADD CONSTRAINT `EventChangeImage_eventChangeId_fkey` FOREIGN KEY (`eventChangeId`) REFERENCES `EventChange`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventModerator` ADD CONSTRAINT `EventModerator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `EmailVerificationToken` RENAME INDEX `EmailVerificationToken_userId_fkey` TO `EmailVerificationToken_userId_idx`;
