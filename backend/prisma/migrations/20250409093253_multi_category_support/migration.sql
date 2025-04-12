/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Event` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_categoryId_fkey`;

-- DropIndex
DROP INDEX `Event_categoryId_fkey` ON `Event`;

-- AlterTable
ALTER TABLE `Event` DROP COLUMN `categoryId`;

-- CreateTable
CREATE TABLE `_EventCategories` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EventCategories_AB_unique`(`A`, `B`),
    INDEX `_EventCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_EventCategories` ADD CONSTRAINT `_EventCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventCategories` ADD CONSTRAINT `_EventCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
