-- AlterTable
ALTER TABLE `EventOccurrence` ADD COLUMN `eventDayId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `EventOccurrence` ADD CONSTRAINT `EventOccurrence_eventDayId_fkey` FOREIGN KEY (`eventDayId`) REFERENCES `EventDay`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
