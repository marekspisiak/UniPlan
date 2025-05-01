/*
  Warnings:

  - You are about to alter the column `title` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(80)`.
  - You are about to alter the column `location` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(120)`.
  - You are about to alter the column `title` on the `EventChange` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(80)`.
  - You are about to alter the column `location` on the `EventChange` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(120)`.

*/
-- AlterTable
ALTER TABLE `Event` MODIFY `title` VARCHAR(80) NOT NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `location` VARCHAR(120) NULL;

-- AlterTable
ALTER TABLE `EventChange` MODIFY `title` VARCHAR(80) NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `location` VARCHAR(120) NULL;
