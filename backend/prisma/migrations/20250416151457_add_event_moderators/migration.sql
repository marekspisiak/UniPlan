/*
  Warnings:

  - You are about to drop the `_EventModerators` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_EventModerators` DROP FOREIGN KEY `_EventModerators_A_fkey`;

-- DropForeignKey
ALTER TABLE `_EventModerators` DROP FOREIGN KEY `_EventModerators_B_fkey`;

-- DropTable
DROP TABLE `_EventModerators`;

-- CreateTable
CREATE TABLE `EventModerator` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `canEditEvent` BOOLEAN NOT NULL DEFAULT false,
    `canManageParticipants` BOOLEAN NOT NULL DEFAULT false,
    `canManageSubscribers` BOOLEAN NOT NULL DEFAULT false,
    `canManageModerators` BOOLEAN NOT NULL DEFAULT false,
    `canRepostEvent` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `EventModerator_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventModerator` ADD CONSTRAINT `EventModerator_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventModerator` ADD CONSTRAINT `EventModerator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
