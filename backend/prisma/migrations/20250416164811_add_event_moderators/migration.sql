/*
  Warnings:

  - You are about to drop the column `eventId` on the `EventModerator` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seriesId,userId]` on the table `EventModerator` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seriesId` to the `EventModerator` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `EventModerator` DROP FOREIGN KEY `EventModerator_eventId_fkey`;

-- DropIndex
DROP INDEX `EventModerator_eventId_userId_key` ON `EventModerator`;

-- AlterTable
ALTER TABLE `EventModerator` DROP COLUMN `eventId`,
    ADD COLUMN `seriesId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `EventSeries` (
    `id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `EventModerator_seriesId_userId_key` ON `EventModerator`(`seriesId`, `userId`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `EventSeries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventModerator` ADD CONSTRAINT `EventModerator_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `EventSeries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
