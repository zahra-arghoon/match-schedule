/*
  Warnings:

  - You are about to drop the `Pitch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Gap" DROP CONSTRAINT "Gap_pitchId_fkey";

-- DropForeignKey
ALTER TABLE "Pitch" DROP CONSTRAINT "Pitch_eventId_fkey";

-- DropTable
DROP TABLE "Pitch";
