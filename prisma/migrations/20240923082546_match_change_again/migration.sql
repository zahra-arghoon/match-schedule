/*
  Warnings:

  - A unique constraint covering the columns `[eventId,team1Id,team2Id,statusId,pitchId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "Match_eventId_team1Id_team2Id_statusId_pitchId_key" ON "Match"("eventId", "team1Id", "team2Id", "statusId", "pitchId");
