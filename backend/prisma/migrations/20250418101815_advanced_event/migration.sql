-- AlterTable
ALTER TABLE `Event` MODIFY `location` VARCHAR(191) NULL,
    MODIFY `startDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `EventChange` ADD COLUMN `allowRecurringAttendance` BOOLEAN NULL,
    MODIFY `joinDaysBeforeStart` INTEGER NULL;
