-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_pitchId_fkey";

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
