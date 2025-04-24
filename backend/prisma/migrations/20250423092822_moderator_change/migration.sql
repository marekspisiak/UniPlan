/*
  Warnings:

  - You are about to drop the column `eventDayId` on the `EventChange` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventChangeId]` on the table `EventDay` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `EventChange` DROP FOREIGN KEY `EventChange_eventDayId_fkey`;

-- DropIndex
DROP INDEX `EventChange_eventDayId_fkey` ON `EventChange`;

-- AlterTable
ALTER TABLE `EventChange` DROP COLUMN `eventDayId`;

-- AlterTable
ALTER TABLE `EventDay` ADD COLUMN `eventChangeId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `EventDay_eventChangeId_key` ON `EventDay`(`eventChangeId`);

-- AddForeignKey
ALTER TABLE `EventDay` ADD CONSTRAINT `EventDay_eventChangeId_fkey` FOREIGN KEY (`eventChangeId`) REFERENCES `EventChange`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
