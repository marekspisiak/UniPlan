/*
  Warnings:

  - Added the required column `eventImageId` to the `EventChangeImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `EventChangeImage` ADD COLUMN `eventImageId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `EventChangeImage` ADD CONSTRAINT `EventChangeImage_eventImageId_fkey` FOREIGN KEY (`eventImageId`) REFERENCES `EventImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
