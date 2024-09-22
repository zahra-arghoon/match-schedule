/*
  Warnings:

  - Added the required column `duration` to the `Gap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gap" ADD COLUMN     "duration" INTEGER NOT NULL;
