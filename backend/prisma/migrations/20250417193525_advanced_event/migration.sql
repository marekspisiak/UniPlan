/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Day` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Day_name_key` ON `Day`(`name`);
