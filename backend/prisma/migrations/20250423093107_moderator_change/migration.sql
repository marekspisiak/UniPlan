/*
  Warnings:

  - A unique constraint covering the columns `[eventChangeId]` on the table `EventOccurrence` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `EventOccurrence_eventChangeId_key` ON `EventOccurrence`(`eventChangeId`);
