-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "groupId" INTEGER,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxTeam" INTEGER NOT NULL DEFAULT 4,
    "minTeam" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timing" (
    "id" SERIAL NOT NULL,
    "gameTime" INTEGER NOT NULL,
    "halfTime" INTEGER NOT NULL,
    "gapTime" INTEGER NOT NULL,

    CONSTRAINT "Timing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'event1',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT '2023-01-01 08:00:00 +00:00',
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT '2023-01-01 15:00:00 +00:00',
    "pitchNumber" INTEGER,
    "timeId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "team1Id" INTEGER NOT NULL,
    "team2Id" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "pitchId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL DEFAULT 1,
    "scheduledTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gap" (
    "id" SERIAL NOT NULL,
    "pitchId" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pitch" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "statusId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Pitch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Timing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_team1Id_fkey" FOREIGN KEY ("team1Id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_team2Id_fkey" FOREIGN KEY ("team2Id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gap" ADD CONSTRAINT "Gap_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
