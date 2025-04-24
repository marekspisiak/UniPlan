/*
  Warnings:

  - You are about to drop the `_EventModerators` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `eventId` to the `EventModerator` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_EventModerators` DROP FOREIGN KEY `_EventModerators_A_fkey`;

-- DropForeignKey
ALTER TABLE `_EventModerators` DROP FOREIGN KEY `_EventModerators_B_fkey`;

-- AlterTable
ALTER TABLE `EventModerator` ADD COLUMN `eventId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `_EventModerators`;

-- AddForeignKey
ALTER TABLE `EventModerator` ADD CONSTRAINT `EventModerator_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
