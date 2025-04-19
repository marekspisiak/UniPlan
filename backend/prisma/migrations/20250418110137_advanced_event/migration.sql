-- AlterTable
ALTER TABLE `Event` ADD COLUMN `hasEndDate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasEndTime` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasStartDate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasStartTime` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `EventOccurrence` MODIFY `date` DATETIME(3) NULL;
