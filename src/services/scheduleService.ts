import { generateMatches } from './generateMatchesService';
import { calculatePitchesNeeded } from '../utils/getPitchNumber';
import { createEvent } from './eventService';
import { getTimingById } from './timingService';
import { PrismaClient } from '@prisma/client';
import { ITiming, IEvent, IMatch } from '../interfaces/interface';
import { calculateMatchesPerPitch } from '../utils/validateCustomPitches';
import { createMatch } from '../services/matchService';
import { log } from 'console';

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
}

const prisma = new PrismaClient();

// export const newschedule = async (
//     eventId: number,
//     matchGroups: any,
//     totalMatches: number,
//     totalGameTime: number,
//     availableTime: number,
//     eventStartDate: Date,
//     eventEndDate: Date,
//     pitchNumber: number
// ) => {
//     return await prisma.$transaction(async (prisma) => {
//         // Update the event with pitchNumber, startDate, and endDate
//         await prisma.event.update({
//             where: { id: eventId },
//             data: { pitchNumber, startDate: eventStartDate, endDate: eventEndDate }
//         });

//         const matchesPerPitchArray = calculateMatchesPerPitch(totalMatches, pitchNumber);

//         // Fetch existing matches for deletion
//         const existingMatches = await prisma.match.findMany({ where: { eventId } });
//         if (existingMatches.length > 0) {
//             await prisma.match.deleteMany({ where: { eventId } });
//         }

//         await createOrUpdatePitches(prisma, eventId, pitchNumber, availableTime);

//         const allPitches = await prisma.pitch.findMany({ where: { eventId } });

//         // Generate time slots and schedule matches
//         const timeSlots = generateTimeSlotsByGroups(eventStartDate, totalGameTime, matchesPerPitchArray);
//         const schedule = scheduleMatches(timeSlots, matchGroups);
//         const groupedMatches = groupScheduledMatchesByTime(schedule);

//         // Create or update matches
//         const createdMatches = await createOrUpdateMatches(prisma, groupedMatches, eventId, allPitches, totalGameTime);

//         return { status: 'success', message: 'Matches recreated successfully', createdMatches };
//     });
// };
export const newschedule = async (
    eventId: number,
    matchGroups: any,
    totalMatches: number,
    totalGameTime: number,
    availableTime: number,
    eventStartDate: Date,
    eventEndDate: Date,
    pitchNumber: number
) => {
    try {
        // Update the event with pitchNumber, startDate, and endDate
        await prisma.event.update({
            where: { id: eventId },
            data: { pitchNumber: pitchNumber, startDate: eventStartDate, endDate: eventEndDate }
        });
        const matchesPerPitchArray = calculateMatchesPerPitch(totalMatches, pitchNumber); // Use the function to get the match distribution
        // Create or update the pitches
        await prisma.match.deleteMany({ where: { eventId } });

        await createOrUpdatePitches(eventId, pitchNumber, availableTime);
        // Fetch all pitches for the event
        const allPitches = await prisma.pitch.findMany({ where: { eventId: eventId } });
        // Generate time slots and schedule matches
        const result = generateTimeSlotsByGroups(eventStartDate, totalGameTime, matchesPerPitchArray);
        let pitchTimeSlots: string[][] = result;

        const schedule = scheduleMatches(pitchTimeSlots, matchGroups);
        const groupedMatches = groupScheduledMatchesByTime(schedule);

        // Create or update matches
        const createdMatches = await createOrUpdateMatches(groupedMatches, eventId, allPitches, totalGameTime);

        if (createdMatches.status === 'success') {
            return { status: 'success', message: 'Matches recreated successfully', createdMatches };
        } else {
            return { status: 'error', message: 'Failed to schedule matches' };
        }
        return { status: 'success', message: 'Matches recreated successfully', createdMatches };
    } catch (error) {
        console.error('Error during scheduling:', error);
        return { status: 'error', message: 'Failed to schedule matches' };
    }
};

export const createOrUpdatePitches = async (eventId: number, pitchNumber: number, availableTime: number) => {
    try {
        await prisma.pitch.deleteMany({ where: { eventId } });

        const pitchesToCreate = Array.from({ length: pitchNumber }, (_, index) => ({
            eventId,
            duration: availableTime,
            name: `Pitch ${index + 1}`
        }));

        await prisma.pitch.createMany({ data: pitchesToCreate });

        return { status: 'success', message: 'Pitches recreated successfully' };
    } catch (error) {
        console.error('Error creating or updating pitches:', error);
        return { status: 'error', message: 'Failed to recreate pitches' };
    }
};

export const createOrUpdateMatches = async (data: MatchInput[][], eventId: number, allPitches: any, totalGameTime: number) => {
    try {

        const matches: Match[] = [];
        data.forEach((group, groupIndex) => {
            const orderInddex = ++groupIndex;

            group.forEach((matchInfo, matchIndex) => {
                const match: Match = {
                    eventId,
                    team1Id: matchInfo.match.team1,
                    team2Id: matchInfo.match.team2,
                    groupId: matchInfo.match.groupId,
                    pitchId: allPitches[matchIndex].id,
                    orderIndex: orderInddex,
                    scheduledTime: new Date(matchInfo.time),
                    duration: totalGameTime
                };
                matches.push(match);
            });
        });

        await prisma.match.createMany({ data: matches });

        return { status: 'success', message: 'Matches recreated successfully' };
    } catch (error) {
        console.error('Error creating or updating matches:', error);
        return { status: 'error', message: 'Failed to recreate matches' };
    }
};
function scheduleMatches(availableTimes: TimeSlot[][], matchGroups: InsideMatch[][]): { match: InsideMatch; time: TimeSlot }[] {
    console.log(availableTimes, 'availableTimes');

    const scheduledMatches: { match: InsideMatch; time: TimeSlot }[] = [];
    const teamSchedule: Record<number, TimeSlot> = {};
    const timeSlotOccupancy: Record<string, Set<number>> = {};
    const pitches = availableTimes.length;
    const matchesPerPitch = availableTimes[0].length;

    console.log(pitches, 'pitches');
    console.log(matchesPerPitch, 'matchesPerPitch');

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

const generateTimeSlots = (startDate: Date, endDate: Date, gameTime: number): string[] => {
    let slots: string[] = [];
    let currentTime = new Date(startDate);

    while (currentTime.getTime() + gameTime * 60 * 1000 <= endDate.getTime()) {
        slots.push(currentTime.toISOString());
        currentTime.setMinutes(currentTime.getMinutes() + gameTime);
    }

    return slots;
};

type InsideMatch = { team1: number; team2: number; groupId: number };
type TimeSlot = string;

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
