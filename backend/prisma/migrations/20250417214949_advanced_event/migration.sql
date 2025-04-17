/*
  Warnings:

  - You are about to drop the column `enableRecurringAttendance` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Event` DROP COLUMN `enableRecurringAttendance`,
    ADD COLUMN `allowRecurringAttendance` BOOLEAN NOT NULL DEFAULT false;
