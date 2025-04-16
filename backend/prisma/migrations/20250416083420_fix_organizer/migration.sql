-- AlterTable
ALTER TABLE `Event` ADD COLUMN `seriesId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `_EventSubscribers` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EventSubscribers_AB_unique`(`A`, `B`),
    INDEX `_EventSubscribers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_EventSubscribers` ADD CONSTRAINT `_EventSubscribers_A_fkey` FOREIGN KEY (`A`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventSubscribers` ADD CONSTRAINT `_EventSubscribers_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
