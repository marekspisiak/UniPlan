/*
  Warnings:

  - You are about to drop the `_ChangeCategories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_ChangeCategories` DROP FOREIGN KEY `_ChangeCategories_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ChangeCategories` DROP FOREIGN KEY `_ChangeCategories_B_fkey`;

-- DropTable
DROP TABLE `_ChangeCategories`;
