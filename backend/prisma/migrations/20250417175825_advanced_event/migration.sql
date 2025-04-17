/*
  Warnings:

  - You are about to drop the column `date` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `seriesId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `canManageSubscribers` on the `EventModerator` table. All the data in the column will be lost.
  - You are about to drop the column `seriesId` on the `EventModerator` table. All the data in the column will be lost.
  - You are about to drop the `EventSeries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventParticipants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventSubscribers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `startDate` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_seriesId_fkey`;

-- DropForeignKey
ALTER TABLE `EventModerator` DROP FOREIGN KEY `EventModerator_seriesId_fkey`;

-- DropForeignKey
ALTER TABLE `_EventParticipants` DROP FOREIGN KEY `_EventParticipants_A_fkey`;

-- DropForeignKey
ALTER TABLE `_EventParticipants` DROP FOREIGN KEY `_EventParticipants_B_fkey`;

-- DropForeignKey
ALTER TABLE `_EventSubscribers` DROP FOREIGN KEY `_EventSubscribers_A_fkey`;

-- DropForeignKey
ALTER TABLE `_EventSubscribers` DROP FOREIGN KEY `_EventSubscribers_B_fkey`;

-- DropIndex
DROP INDEX `Event_seriesId_fkey` ON `Event`;

-- DropIndex
DROP INDEX `EventModerator_seriesId_userId_key` ON `EventModerator`;

-- AlterTable
ALTER TABLE `Event` DROP COLUMN `date`,
    DROP COLUMN `endTime`,
    DROP COLUMN `seriesId`,
    DROP COLUMN `time`,
    ADD COLUMN `endDate` DATETIME(3) NULL,
    ADD COLUMN `repeatUntil` DATETIME(3) NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `EventModerator` DROP COLUMN `canManageSubscribers`,
    DROP COLUMN `seriesId`,
    ADD COLUMN `canManageAttendees` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `EventSeries`;

-- DropTable
DROP TABLE `_EventParticipants`;

-- DropTable
DROP TABLE `_EventSubscribers`;

-- CreateTable
CREATE TABLE `EventDay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventAttendancyOption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `week` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventChange` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventDayId` INTEGER NULL,
    `eventAttendancyOptionId` INTEGER NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `capacity` INTEGER NULL,
    `mainImage` VARCHAR(191) NULL,
    `createdBy` INTEGER NULL,
    `updatedBy` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventOccurrence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `eventChangeId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Day` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventChangeImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `eventChangeId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ChangeCategories` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ChangeCategories_AB_unique`(`A`, `B`),
    INDEX `_ChangeCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EventModerators` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EventModerators_AB_unique`(`A`, `B`),
    INDEX `_EventModerators_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AttendancyOptionsUsers` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AttendancyOptionsUsers_AB_unique`(`A`, `B`),
    INDEX `_AttendancyOptionsUsers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AttendancyOptionDays` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AttendancyOptionDays_AB_unique`(`A`, `B`),
    INDEX `_AttendancyOptionDays_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_OccurrenceParticipants` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_OccurrenceParticipants_AB_unique`(`A`, `B`),
    INDEX `_OccurrenceParticipants_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CycleDays` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CycleDays_AB_unique`(`A`, `B`),
    INDEX `_CycleDays_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventDay` ADD CONSTRAINT `EventDay_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventChange` ADD CONSTRAINT `EventChange_eventDayId_fkey` FOREIGN KEY (`eventDayId`) REFERENCES `EventDay`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventChange` ADD CONSTRAINT `EventChange_eventAttendancyOptionId_fkey` FOREIGN KEY (`eventAttendancyOptionId`) REFERENCES `EventAttendancyOption`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventChange` ADD CONSTRAINT `EventChange_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventChange` ADD CONSTRAINT `EventChange_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventOccurrence` ADD CONSTRAINT `EventOccurrence_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventOccurrence` ADD CONSTRAINT `EventOccurrence_eventChangeId_fkey` FOREIGN KEY (`eventChangeId`) REFERENCES `EventChange`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventChangeImage` ADD CONSTRAINT `EventChangeImage_eventChangeId_fkey` FOREIGN KEY (`eventChangeId`) REFERENCES `EventChange`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ChangeCategories` ADD CONSTRAINT `_ChangeCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ChangeCategories` ADD CONSTRAINT `_ChangeCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `EventChange`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventModerators` ADD CONSTRAINT `_EventModerators_A_fkey` FOREIGN KEY (`A`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventModerators` ADD CONSTRAINT `_EventModerators_B_fkey` FOREIGN KEY (`B`) REFERENCES `EventModerator`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AttendancyOptionsUsers` ADD CONSTRAINT `_AttendancyOptionsUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `EventAttendancyOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AttendancyOptionsUsers` ADD CONSTRAINT `_AttendancyOptionsUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AttendancyOptionDays` ADD CONSTRAINT `_AttendancyOptionDays_A_fkey` FOREIGN KEY (`A`) REFERENCES `EventAttendancyOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AttendancyOptionDays` ADD CONSTRAINT `_AttendancyOptionDays_B_fkey` FOREIGN KEY (`B`) REFERENCES `EventDay`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_OccurrenceParticipants` ADD CONSTRAINT `_OccurrenceParticipants_A_fkey` FOREIGN KEY (`A`) REFERENCES `EventOccurrence`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_OccurrenceParticipants` ADD CONSTRAINT `_OccurrenceParticipants_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CycleDays` ADD CONSTRAINT `_CycleDays_A_fkey` FOREIGN KEY (`A`) REFERENCES `Day`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CycleDays` ADD CONSTRAINT `_CycleDays_B_fkey` FOREIGN KEY (`B`) REFERENCES `EventDay`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
