/*
  Warnings:

  - Made the column `eventId` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderIndex` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pitchId` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `duration` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_pitchId_fkey";

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "eventId" SET NOT NULL,
ALTER COLUMN "orderIndex" SET NOT NULL,
ALTER COLUMN "pitchId" SET NOT NULL,
ALTER COLUMN "duration" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
