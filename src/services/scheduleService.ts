import { PrismaClient } from '@prisma/client';
import { calculateMatchesPerPitch } from '../utils/validateCustomPitches';
import { createMatch } from '../services/matchService';
import { log } from 'console';
type InsideMatch = { team1: number; team2: number; groupId: number };
type TimeSlot = string;
interface MatchInput {
    match: {
        team1: number;
        team2: number;
        groupId: number;
    };
    time: string;
}

interface Match {
    eventId: number;
    team1Id: number;
    team2Id: number;
    groupId: number;
    pitchId: number;
    orderIndex: number;
    scheduledTime: Date;
    duration: number;
    statusId: number;
}

const prisma = new PrismaClient();

export const newschedule = async (
    eventId: number,
    matchGroups: any,
    totalMatches: number,
    totalGameTime: number,
    availableTime: number,
    eventStartDate: Date,
    eventEndDate: Date,
    pitchNumber: number,
    maxTeamcount: number
) => {
    try {
        // Update the event with pitchNumber, startDate, and endDate
        await prisma.event.update({
            where: { id: eventId },
            data: { pitchNumber: pitchNumber, startDate: eventStartDate, endDate: eventEndDate }
        });
        const matchesPerPitchArray = calculateMatchesPerPitch(totalMatches, pitchNumber); // Use the function to get the match distribution
        const matchesPerPitch = matchesPerPitchArray[0];

        const minTeam = --maxTeamcount;
        if (matchesPerPitch < minTeam) {
            return { status: 'error', message: 'this event does not have valid number of match Per pitch for your teams' };
        }
        const result = generateTimeSlotsByGroups(eventStartDate, totalGameTime, matchesPerPitchArray);

        let pitchTimeSlots: string[][] = result;

        const schedule = scheduleMatches(pitchTimeSlots, matchGroups);
        const groupedMatches = groupScheduledMatchesByTime(schedule);
       const createdMatches = await createOrUpdateMatches(groupedMatches, eventId, availableTime, pitchNumber, totalGameTime);

       if (createdMatches.status === 'success') {
           return { status: 'success', message: 'Matches recreated successfully', createdMatches };
       } else {
           return { status: 'error', message: 'Failed to schedule matches' };
       }
    } catch (error) {
        console.error('Error during scheduling:', error);
        return { status: 'error', message: 'Failed to schedule matches' };
    }
};
export const createOrUpdatePitches = async (eventId: number, pitchNumber: number, availableTime: number) => {
    try {
        // Step 1: Mark old pitches as inactive (soft delete)
        await prisma.pitch.updateMany({
            where: { eventId, statusId: 1 }, // Only update active pitches
            data: { statusId: 0 }
        });

        // Step 2: Create new pitches
        const newPitches = Array.from({ length: pitchNumber }, (_, index) => ({
            eventId,
            duration: availableTime,
            name: `Pitch ${index + 1}`,
            statusId: 1 // Mark new pitches as active
        }));

        await prisma.pitch.createMany({ data: newPitches });

        return { status: 'success', message: 'Pitches recreated successfully' };
    } catch (error) {
        console.error('Error creating or updating pitches:', error);
        return { status: 'error', message: 'Failed to recreate pitches' };
    }
};
export const createOrUpdateMatches = async (
    data: MatchInput[][],
    eventId: number,
    availableTime: number,
    pitchNumber: number,
    totalGameTime: number
) => {
    try {
        // Step 1: Create or update the pitches
        const pitchResult = await createOrUpdatePitches(eventId, pitchNumber, availableTime);
        if (pitchResult.status === 'error') {
            return pitchResult; // Exit if pitch creation fails
        }

        // Step 2: Fetch all active pitches for the event
        const allPitches = await prisma.pitch.findMany({ where: { eventId, statusId: 1 } });

        // Step 3: Mark old matches as inactive (soft delete)
        await prisma.match.updateMany({
            where: { eventId, statusId: 1 }, // Only update active matches
            data: { statusId: 0 }
        });

        // Step 4: Prepare the new matches for creation
        const newMatches: Match[] = [];
        data.forEach((group, groupIndex) => {
            const orderIndex = ++groupIndex;

            group.forEach((matchInfo, matchIndex) => {
                const match: Match = {
                    eventId,
                    team1Id: matchInfo.match.team1,
                    team2Id: matchInfo.match.team2,
                    groupId: matchInfo.match.groupId,
                    pitchId: allPitches[matchIndex].id, // Use pre-fetched pitches
                    orderIndex: orderIndex,
                    scheduledTime: new Date(matchInfo.time),
                    duration: totalGameTime,
                    statusId: 1 // New matches are active
                };
                newMatches.push(match);
            });
        });

        await prisma.$transaction(async (prisma) => {
            // Insert new matches
            await prisma.match.createMany({
                data: newMatches
            });

            await prisma.match.deleteMany({
                where: { eventId, statusId: 0 } // Delete inactive matches
            });

            await prisma.pitch.deleteMany({
                where: { eventId, statusId: 0 } // Delete inactive pitches
            });
        });

        return { status: 'success', message: 'Matches recreated successfully' };
    } catch (error) {
        await prisma.match.updateMany({
            where: { eventId, statusId: 0 },
            data: { statusId: 1 } // Reactivate old matches
        });

        await prisma.pitch.deleteMany({
            where: { eventId, statusId: 1 } // Delete newly created pitches
        });
        await prisma.pitch.updateMany({
            where: { eventId, statusId: 0 },
            data: { statusId: 1 } // Reactivate old pitches
        });

        return { status: 'error', message: 'Failed to recreate matches. Old matches and pitches were restored.' };
    }
};
function scheduleMatches(availableTimes: TimeSlot[][], matchGroups: InsideMatch[][]): { match: InsideMatch; time: TimeSlot }[] {
    console.log(availableTimes, 'availableTimes');

    const scheduledMatches: { match: InsideMatch; time: TimeSlot }[] = [];
    const teamSchedule: Record<number, TimeSlot> = {};
    const timeSlotOccupancy: Record<string, Set<number>> = {};
    const pitches = availableTimes.length;
    const matchesPerPitch = availableTimes[0].length;


    matchGroups.forEach((groupMatches) => {
        let matchIndex = 0;
        while (matchIndex < groupMatches.length) {
            let matchScheduled = false;
            for (let pitch = 0; pitch < pitches && matchIndex < groupMatches.length; pitch++) {
                for (let slotIndex = 0; slotIndex < matchesPerPitch && matchIndex < groupMatches.length; slotIndex++) {
                    const timeSlot = availableTimes[pitch][slotIndex];
                    const match = groupMatches[matchIndex];

                    const timeSlotKey = `${timeSlot}-${pitch + 1}`;
                    const team1Occupied = timeSlotOccupancy[timeSlotKey]?.has(match.team1);
                    const team2Occupied = timeSlotOccupancy[timeSlotKey]?.has(match.team2);

                    // If both teams are free in this time slot, schedule the match
                    if (!team1Occupied && !team2Occupied) {
                        scheduledMatches.push({ match, time: timeSlot });
                        teamSchedule[match.team1] = timeSlot;
                        teamSchedule[match.team2] = timeSlot;

                        // Mark the time slot as occupied by the two teams
                        timeSlotOccupancy[timeSlotKey] = timeSlotOccupancy[timeSlotKey] || new Set();
                        timeSlotOccupancy[timeSlotKey].add(match.team1).add(match.team2);

                        // Mark the match as scheduled and move to the next one
                        matchScheduled = true;
                        matchIndex++;

                        // No need to break, allow other matches to be scheduled at later times
                    }
                }
                // Continue with other time slots for the same pitch
            }
        }
    });

    return scheduledMatches;
}
function groupScheduledMatchesByTime(scheduledMatches: { match: InsideMatch; time: TimeSlot }[]): { match: InsideMatch; time: TimeSlot }[][] {
    const groupedMatches: Record<string, { match: InsideMatch; time: TimeSlot }[]> = {};

    scheduledMatches.forEach((match) => {
        if (!groupedMatches[match.time]) groupedMatches[match.time] = [];
        groupedMatches[match.time].push(match);
    });

    return Object.values(groupedMatches);
}
const generateTimeSlotsByGroups = (startDate: Date, gameTime: number, groupSizes: number[]): string[][] => {
    let slots: string[] = [];
    let currentTime = new Date(startDate);
    console.log(groupSizes);

    // First, generate all the time slots for one full cycle.
    for (let i = 0; i < groupSizes[0]; i++) {
        slots.push(currentTime.toISOString());
        currentTime.setMinutes(currentTime.getMinutes() + gameTime);
    }

    // Now, create the result array where each group gets the same time slots.
    let result: string[][] = groupSizes.map(() => [...slots]);

    return result;
};
