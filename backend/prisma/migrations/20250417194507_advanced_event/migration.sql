/*
  Warnings:

  - You are about to drop the `_CycleDays` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dayId` to the `EventDay` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_CycleDays` DROP FOREIGN KEY `_CycleDays_A_fkey`;

-- DropForeignKey
ALTER TABLE `_CycleDays` DROP FOREIGN KEY `_CycleDays_B_fkey`;

-- DropIndex
DROP INDEX `Day_name_key` ON `Day`;

-- AlterTable
ALTER TABLE `EventDay` ADD COLUMN `dayId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `_CycleDays`;

-- AddForeignKey
ALTER TABLE `EventDay` ADD CONSTRAINT `EventDay_dayId_fkey` FOREIGN KEY (`dayId`) REFERENCES `Day`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
