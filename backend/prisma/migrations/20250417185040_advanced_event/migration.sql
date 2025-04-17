/*
  Warnings:

  - Added the required column `joinDaysBeforeStart` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joinDaysBeforeStart` to the `EventChange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Event` ADD COLUMN `attendancyLimit` INTEGER NULL,
    ADD COLUMN `joinDaysBeforeStart` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `EventChange` ADD COLUMN `joinDaysBeforeStart` INTEGER NOT NULL;
