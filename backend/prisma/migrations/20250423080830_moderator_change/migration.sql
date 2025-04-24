/*
  Warnings:

  - Added the required column `hasEndTime` to the `EventChange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hasStartDate` to the `EventChange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hasStartTime` to the `EventChange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `EventChange` ADD COLUMN `hasEndTime` BOOLEAN NOT NULL,
    ADD COLUMN `hasStartDate` BOOLEAN NOT NULL,
    ADD COLUMN `hasStartTime` BOOLEAN NOT NULL,
    MODIFY `startDate` DATETIME(3) NULL;
