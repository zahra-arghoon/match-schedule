/*
  Warnings:

  - Made the column `pitchId` on table `Gap` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Gap" DROP CONSTRAINT "Gap_pitchId_fkey";

-- AlterTable
ALTER TABLE "Gap" ALTER COLUMN "pitchId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Gap" ADD CONSTRAINT "Gap_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
