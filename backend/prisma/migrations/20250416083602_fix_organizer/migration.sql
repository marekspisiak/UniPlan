/*
  Warnings:

  - Made the column `seriesId` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Event` MODIFY `seriesId` VARCHAR(191) NOT NULL;
