/*
  Warnings:

  - You are about to drop the column `pitchId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the `Pitch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_pitchId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "pitchId",
ADD COLUMN     "pitchIndex" INTEGER;

-- DropTable
DROP TABLE "Pitch";
