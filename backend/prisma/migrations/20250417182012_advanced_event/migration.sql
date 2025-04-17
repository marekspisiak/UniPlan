/*
  Warnings:

  - You are about to drop the column `eventAttendancyOptionId` on the `EventChange` table. All the data in the column will be lost.
  - You are about to drop the `EventAttendancyOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AttendancyOptionDays` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AttendancyOptionsUsers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `week` to the `EventDay` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `EventChange` DROP FOREIGN KEY `EventChange_eventAttendancyOptionId_fkey`;

-- DropForeignKey
ALTER TABLE `_AttendancyOptionDays` DROP FOREIGN KEY `_AttendancyOptionDays_A_fkey`;

-- DropForeignKey
ALTER TABLE `_AttendancyOptionDays` DROP FOREIGN KEY `_AttendancyOptionDays_B_fkey`;

-- DropForeignKey
ALTER TABLE `_AttendancyOptionsUsers` DROP FOREIGN KEY `_AttendancyOptionsUsers_A_fkey`;

-- DropForeignKey
ALTER TABLE `_AttendancyOptionsUsers` DROP FOREIGN KEY `_AttendancyOptionsUsers_B_fkey`;

-- DropIndex
DROP INDEX `EventChange_eventAttendancyOptionId_fkey` ON `EventChange`;

-- AlterTable
ALTER TABLE `EventChange` DROP COLUMN `eventAttendancyOptionId`;

-- AlterTable
ALTER TABLE `EventDay` ADD COLUMN `week` INTEGER NOT NULL;

-- DropTable
DROP TABLE `EventAttendancyOption`;

-- DropTable
DROP TABLE `_AttendancyOptionDays`;

-- DropTable
DROP TABLE `_AttendancyOptionsUsers`;

-- CreateTable
CREATE TABLE `_EventDayAttendancy` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EventDayAttendancy_AB_unique`(`A`, `B`),
    INDEX `_EventDayAttendancy_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_EventDayAttendancy` ADD CONSTRAINT `_EventDayAttendancy_A_fkey` FOREIGN KEY (`A`) REFERENCES `EventDay`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventDayAttendancy` ADD CONSTRAINT `_EventDayAttendancy_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
