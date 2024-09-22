/*
  Warnings:

  - You are about to drop the column `sequence` on the `Match` table. All the data in the column will be lost.
  - Made the column `name` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timeId` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `duration` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderIndex` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_timeId_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "timeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "sequence",
ADD COLUMN     "duration" TEXT NOT NULL,
ADD COLUMN     "orderIndex" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Gap" (
    "id" SERIAL NOT NULL,
    "pitchIndex" INTEGER,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "Gap_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Timing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
