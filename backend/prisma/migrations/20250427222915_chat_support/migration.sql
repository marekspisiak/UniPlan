-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Room` DROP FOREIGN KEY `Room_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `RoomMember` DROP FOREIGN KEY `RoomMember_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `RoomMember` DROP FOREIGN KEY `RoomMember_userId_fkey`;

-- DropIndex
DROP INDEX `Message_roomId_fkey` ON `Message`;

-- DropIndex
DROP INDEX `Message_userId_fkey` ON `Message`;

-- DropIndex
DROP INDEX `RoomMember_userId_fkey` ON `RoomMember`;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomMember` ADD CONSTRAINT `RoomMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomMember` ADD CONSTRAINT `RoomMember_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
