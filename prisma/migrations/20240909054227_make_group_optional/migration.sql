-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_groupId_fkey";

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "groupId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
