/*
  Warnings:

  - Added the required column `scheduledTime` to the `Gap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gap" ADD COLUMN     "scheduledTime" TIMESTAMP(3) NOT NULL;
