/*
  Warnings:

  - You are about to drop the column `pitches` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `pitchIndex` on the `Gap` table. All the data in the column will be lost.
  - You are about to drop the column `pitchIndex` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "pitches",
ADD COLUMN     "pitchNumber" INTEGER;

-- AlterTable
ALTER TABLE "Gap" DROP COLUMN "pitchIndex",
ADD COLUMN     "pitchId" INTEGER;

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "pitchIndex",
ADD COLUMN     "pitchId" INTEGER;

-- CreateTable
CREATE TABLE "Pitch" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "Pitch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gap" ADD CONSTRAINT "Gap_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
