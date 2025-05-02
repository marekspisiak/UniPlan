/*
  Warnings:

  - You are about to drop the column `profilePicture` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `profilePicture`,
    ADD COLUMN `profileImageUrl` VARCHAR(191) NOT NULL DEFAULT 'sad';
