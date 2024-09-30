import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { checkPitchAvailability } from '../utils/validateCustomPitches';
import { getPitchById } from './pitchService';
import { getEventById } from './eventService';
interface Match {
    id: number;
    eventId: number;
    team1Id: number;
    team2Id: number;
    groupId: number;
    pitchId: number;
    orderIndex: number;
    scheduledTime: Date;
    duration: number;
}

// Function to move a match
export const moveMatch = async (matchId: number, newOrderIndex: number, newPitchId: number, extendPitchTime: boolean) => {
    try {
        // Fetch the match to be moved
        const matchToMove: Match = await prisma.match.findUniqueOrThrow({
            where: { id: matchId, statusId: 1 }
        });

        const { pitchId: originalPitchId, orderIndex: originalOrderIndex, duration, team1Id, team2Id } = matchToMove;

        // Determine if moving within the same pitch or to a different pitch
        const isSamePitch = originalPitchId === newPitchId;
        const teamsInMatch: number[] = [team1Id, team2Id];

        let simulatedSchedules: Match[];
        if (isSamePitch) {

            // Simulate schedule adjustments on the same pitch
            const { samePitchTeamsInMatch, simulateScheduleUpdated } = await simulateScheduleSamePitch(
                matchToMove,
                originalPitchId,
                originalOrderIndex,
                newOrderIndex
            );
            simulatedSchedules = simulateScheduleUpdated;
            teamsInMatch.push(...samePitchTeamsInMatch);

        } else {
            // Simulate schedule adjustments when moving to a different pitch
            const { originalPitchTeamsInMatch, matches } = await simulateScheduleDifferentPitch(
                matchToMove,
                originalPitchId,
                originalOrderIndex,
                newPitchId,
                newOrderIndex
            );
            simulatedSchedules = matches;
            teamsInMatch.push(...originalPitchTeamsInMatch);
        }
        // Perform conflict checking using the simulated schedules
        const conflictCheckResult = await checkConflictsInSimulatedSchedules(simulatedSchedules, matchId, teamsInMatch);

        if (conflictCheckResult.status === 'conflict') {
            return {
                success: false,
                message: conflictCheckResult.message,
                conflicts: conflictCheckResult.conflicts
            };
        }

        if (!isSamePitch) {
            const pitchAvailability = await checkPitchAvailability(newPitchId, duration, extendPitchTime);

            if (pitchAvailability.status === 'extend_required') {
                return {
                    success: false,
                    message: 'Pitch duration needs to be extended to accommodate the match on the destination pitch'
                };
            }

            if (pitchAvailability.status === 'extended') {
                console.log('Pitch duration extended successfully');
            }
        }

        // Apply the updates to the database
        if (isSamePitch) {
            // Adjust order indexes on the same pitch
            await adjustOrderIndexesSamePitch(originalPitchId, originalOrderIndex, newOrderIndex);
            // Update the match's orderIndex
            await prisma.match.update({
                where: { id: matchId, statusId: 1 },
                data: { orderIndex: newOrderIndex }
            });
            // Update schedules on the pitch
            await updateMatchSchedule(originalPitchId);
        } else {
            // Adjust order indexes on the destination pitch
            await adjustOrderIndexesNewPitch(newPitchId, newOrderIndex);
            await adjustOrderIndexesOriginalPitch(originalPitchId, originalOrderIndex);
            // Update the match's pitchId and orderIndex
            await prisma.match.update({
                where: { id: matchId, statusId: 1 },
                data: { pitchId: newPitchId, orderIndex: newOrderIndex }
            });
            // Update schedules on the destination pitch
            await updateMatchSchedule(newPitchId);
            await updateMatchSchedule(originalPitchId);
        }

        return { success: true, message: 'Match moved and timings updated successfully' };
    } catch (error) {
        console.error('Error moving match:', error);
        return { success: false, message: 'Failed to move match' };
    }
};

// Simulate schedule adjustments when moving within the same pitch
const simulateScheduleSamePitch = async (
    matchToMove: Match,
    pitchId: number,
    oldOrderIndex: number,
    newOrderIndex: number
): Promise<{ samePitchTeamsInMatch: number[]; simulateScheduleUpdated: Match[] }> => {
    const matches: Match[] = await prisma.match.findMany({
        where: { pitchId, statusId: 1 }
    });
    const gaps = await prisma.gap.findMany({
        where: { pitchId }
    });
    const pitchStartTime: Date = await getPitchStartTime(pitchId);
    // Simulate order index adjustments
    const { samePitchTeamsInMatch, result } = simulateOrderIndexAdjustment(matches, oldOrderIndex, newOrderIndex, 'samePitch', matchToMove);

    // Simulate schedule updates with combined matches and gaps
    const simulateScheduleUpdated: Match[] = simulateScheduleUpdates(result, gaps, pitchStartTime);
    return { samePitchTeamsInMatch, simulateScheduleUpdated };
};

// Simulate schedule adjustments when moving to a different pitch
const simulateScheduleDifferentPitch = async (
    matchToMove: Match,
    originalPitchId: number,
    oldOrderIndex: number,
    newPitchId: number,
    newOrderIndex: number
): Promise<{ originalPitchTeamsInMatch: number[]; matches: Match[] }> => {
    // Get matches and gaps on the original and destination pitches
    const [originalMatches, originalGaps] = await Promise.all([
        prisma.match.findMany({
            where: { pitchId: originalPitchId, statusId: 1 }
        }),
        prisma.gap.findMany({
            where: { pitchId: originalPitchId }
        })
    ]);

    const [destinationMatches, destinationGaps] = await Promise.all([
        prisma.match.findMany({
            where: { pitchId: newPitchId, statusId: 1 }
        }),
        prisma.gap.findMany({
            where: { pitchId: newPitchId }
        })
    ]);

    // Get the pitch start times
    const [originalPitchStartTime, destinationPitchStartTime] = await Promise.all([
        getPitchStartTime(originalPitchId),
        getPitchStartTime(newPitchId)
    ]);

    // Remove the match from the original pitch's matches
    const updatedOriginalMatches = originalMatches.filter((m: Match) => m.id !== matchToMove.id);
    const { simulatedMatches, originalPitchTeamsInMatch } = simulateoriginalOrderIndexAdjustment(updatedOriginalMatches, oldOrderIndex);

    // Simulate order index adjustments on the destination pitch
    const { result } = simulateOrderIndexAdjustment(destinationMatches, null, newOrderIndex, 'differentPitch', matchToMove);
    const simulatedDestinationMatches: Match[] = result;
    // Set the new pitchId and orderIndex for the moved match
    matchToMove.pitchId = newPitchId;
    matchToMove.orderIndex = newOrderIndex;

    // Include the moved match in the destination matches
    simulatedDestinationMatches.push(matchToMove);

    // Simulate schedule updates with combined matches and gaps
    const simulatedOriginalSchedule: Match[] = simulateScheduleUpdates(simulatedMatches, originalGaps, originalPitchStartTime);
    const simulatedDestinationSchedule: Match[] = simulateScheduleUpdates(simulatedDestinationMatches, destinationGaps, destinationPitchStartTime);

    const matches: Match[] = [...simulatedOriginalSchedule, ...simulatedDestinationSchedule];
    return { originalPitchTeamsInMatch, matches };
};

// Helper function to simulate order index adjustments
const simulateOrderIndexAdjustment = (
    matches: Match[],
    oldOrderIndex: number | null,
    newOrderIndex: number,
    moveType: 'samePitch' | 'differentPitch',
    matchToMove: any
) => {
    let simulatedMatches = [...matches];
    let samePitchTeamsInMatch: number[] = [];

    if (moveType === 'samePitch' && oldOrderIndex !== null) {
        // Remove the match to be moved
        simulatedMatches = simulatedMatches.filter((m) => m.id !== matchToMove.id);

        // Adjust orderIndexes
        if (oldOrderIndex < newOrderIndex) {
            // Decrement orderIndex of matches between old and new positions
            simulatedMatches.forEach((match) => {
                samePitchTeamsInMatch.push(match.team1Id);
                samePitchTeamsInMatch.push(match.team2Id);
                if (match.orderIndex > oldOrderIndex && match.orderIndex <= newOrderIndex) {
                    match.orderIndex -= 1;
                }
            });
        } else {
            // Increment orderIndex of matches between new and old positions
            simulatedMatches.forEach((match) => {
                samePitchTeamsInMatch.push(match.team1Id);
                samePitchTeamsInMatch.push(match.team2Id);
                if (match.orderIndex >= newOrderIndex && match.orderIndex < oldOrderIndex) {
                    match.orderIndex += 1;
                }
            });
        }
        // Set the new orderIndex for the moved match and reinsert it
        matchToMove.orderIndex = newOrderIndex;
        simulatedMatches.push(matchToMove);
    } else if (moveType === 'differentPitch') {
        // Increment orderIndex of matches at or after the new position
        simulatedMatches.forEach((match) => {
            if (match.orderIndex >= newOrderIndex) {
                match.orderIndex += 1;
            }
        });
    }

    // Sort matches by orderIndex
    simulatedMatches.sort((a, b) => a.orderIndex - b.orderIndex);
    return { result: simulatedMatches, samePitchTeamsInMatch: samePitchTeamsInMatch };
};

const simulateoriginalOrderIndexAdjustment = (matches: any[], oldOrderIndex: number) => {
    let simulatedMatches = [...matches];
    let originalPitchTeamsInMatch: number[] = [];

    // Increment orderIndex of matches at or after the new position
    simulatedMatches.forEach((match) => {
        if (match.orderIndex > oldOrderIndex) {
            originalPitchTeamsInMatch.push(match.team1Id);
            originalPitchTeamsInMatch.push(match.team2Id);
            match.orderIndex -= 1;
        }
    });

    // Sort matches by orderIndex
    simulatedMatches.sort((a, b) => a.orderIndex - b.orderIndex);
    return { simulatedMatches, originalPitchTeamsInMatch };
};

// Simulate schedule updates
const simulateScheduleUpdates = (matches: any[], gaps: any[], startTime: Date) => {
    // Combine matches and gaps into a single array
    const scheduleItems = [...matches.map((item) => ({ ...item, type: 'match' })), ...gaps.map((item) => ({ ...item, type: 'gap' }))];

    // Sort combined array by orderIndex
    scheduleItems.sort((a, b) => a.orderIndex - b.orderIndex);

    let currentTime = new Date(startTime);
    let lastOrderIndex = 0; // Track the last processed order index
    let defaultDuration = matches[0].duration;

    const simulatedSchedules = [];

    for (const item of scheduleItems) {
        if (item.orderIndex > lastOrderIndex + 1) {
            // This means we've skipped some order indices, so we handle the gap
            const skippedOrders = item.orderIndex - (lastOrderIndex + 1);
            const skippedTime = skippedOrders * defaultDuration * 60000; // Assuming each skipped order represents a fixed time gap (e.g., 60 minutes per order)

            currentTime = new Date(currentTime.getTime() + skippedTime);
        }
        if (item.type === 'gap') {
            // Gap: increase currentTime by gap duration
            const gapDuration = item.duration || 0;
            currentTime = new Date(currentTime.getTime() + gapDuration * 60000);
        } else if (item.type === 'match') {
            // Match: schedule match at currentTime
            const scheduledTime = new Date(currentTime.getTime());
            const matchDuration = item.duration || 0;

            simulatedSchedules.push({
                ...item,
                scheduledTime,
                endTime: new Date(scheduledTime.getTime() + matchDuration * 60000)
            });

            // Advance currentTime by match duration
            currentTime = new Date(currentTime.getTime() + matchDuration * 60000);
        }
        lastOrderIndex = item.orderIndex;
    }

    return simulatedSchedules;
};

// Check for conflicts in the simulated schedules
const checkConflictsInSimulatedSchedules = async (
    simulatedSchedules: any[],
    matchId: number,
    teamsInMatch: number[]
): Promise<{ status: string; message: string; conflicts?: any[] }> => {
    try {
        // Fetch all active matches involving the teams, excluding the match being moved
        const teamMatches = await prisma.match.findMany({
            where: {
                statusId: 1,
                id: { not: matchId },
                OR: [{ team1Id: { in: teamsInMatch } }, { team2Id: { in: teamsInMatch } }]
            },
            select: {
                id: true,
                team1Id: true,
                team2Id: true,
                scheduledTime: true,
                duration: true,
                pitchId: true
            }
        });
        const conflicts = [];
        console.log(teamMatches, 'teams');

        for (const match of teamMatches) {
            const otherStartTime = new Date(match.scheduledTime);
            const otherEndTime = new Date(otherStartTime.getTime() + match.duration * 60000);

            // Check for overlaps with all simulated schedules involving the same teams
            console.log('**************');

            for (const simulatedMatch of simulatedSchedules) {
                console.log(match.id, '=====,,,,,,,,,=======');
                console.log(simulatedMatch.id, '============');
                if (
                    simulatedMatch.id !== match.id &&
                    simulatedMatch.pitchId !== match.pitchId &&
                    (simulatedMatch.team1Id === match.team1Id ||
                        simulatedMatch.team1Id === match.team2Id ||
                        simulatedMatch.team2Id === match.team1Id ||
                        simulatedMatch.team2Id === match.team2Id) &&
                    hasOverlap(simulatedMatch.scheduledTime, simulatedMatch.endTime, otherStartTime, otherEndTime)
                ) {
                    console.log(match.id, '////////////////');

                    conflicts.push({
                        id: match.id,
                        team1Id: match.team1Id,
                        team2Id: match.team2Id,
                        scheduledTime: match.scheduledTime,
                        duration: match.duration,
                        pitchId: match.pitchId
                    });
                    console.log('////////////////');
                }
            }
        }

        if (conflicts.length > 0) {
            const conflictDetails = conflicts
                .map((conflict) => {
                    return `Match ID: ${conflict.id}, Teams: ${conflict.team1Id} vs ${conflict.team2Id}, Pitch ID: ${conflict.pitchId}`;
                })
                .join('\n');

            return {
                status: 'conflict',
                message: `Conflicts detected with the following matches:\n${conflictDetails}`,
                conflicts
            };
        }

        return { status: 'no_conflict', message: 'No conflicts detected' };
    } catch (error) {
        console.error('Error checking conflicts:', error);
        return { status: 'error', message: 'Error occurred while checking conflicts' };
    }
};

// Adjust order indexes when moving within the same pitch
const adjustOrderIndexesSamePitch = async (pitchId: number, oldOrderIndex: number, newOrderIndex: number) => {
    if (oldOrderIndex < newOrderIndex) {
        // Moving the match later in the schedule
        await prisma.match.updateMany({
            where: {
                pitchId,
                statusId: 1,
                orderIndex: {
                    gt: oldOrderIndex,
                    lte: newOrderIndex
                }
            },
            data: {
                orderIndex: {
                    decrement: 1
                }
            }
        });
    } else if (oldOrderIndex > newOrderIndex) {
        // Moving the match earlier in the schedule
        await prisma.match.updateMany({
            where: {
                pitchId,
                statusId: 1,
                orderIndex: {
                    gte: newOrderIndex,
                    lt: oldOrderIndex
                }
            },
            data: {
                orderIndex: {
                    increment: 1
                }
            }
        });
    }
};

// Adjust order indexes when moving to a new pitch
const adjustOrderIndexesNewPitch = async (pitchId: number, newOrderIndex: number) => {
    // Increment the orderIndex of matches at or after the new position
    await prisma.match.updateMany({
        where: {
            pitchId,
            statusId: 1,
            orderIndex: {
                gte: newOrderIndex
            }
        },
        data: {
            orderIndex: {
                increment: 1
            }
        }
    });
};
const adjustOrderIndexesOriginalPitch = async (pitchId: number, oldOrderIndex: number) => {
    // decreament the orderIndex of matches at or after moved match position
    await prisma.match.updateMany({
        where: {
            pitchId,
            statusId: 1,
            orderIndex: {
                gte: oldOrderIndex
            }
        },
        data: {
            orderIndex: {
                decrement: 1
            }
        }
    });
};

// Update match schedules on a pitch
const updateMatchSchedule = async (pitchId: number) => {
    try {
        const matches = await prisma.match.findMany({
            where: { pitchId, statusId: 1 }
        });
        const gaps = await prisma.gap.findMany({
            where: { pitchId }
        });

        // Get pitch start time
        const pitchStartTime = await getPitchStartTime(pitchId);

        // Combine matches and gaps
        const scheduleItems = [...matches.map((item) => ({ ...item, type: 'match' })), ...gaps.map((item) => ({ ...item, type: 'gap' }))];

        // Sort combined array by orderIndex
        scheduleItems.sort((a, b) => a.orderIndex - b.orderIndex);

        let currentTime = new Date(pitchStartTime);
        let lastOrderIndex = 0; // Track the last processed order index
        let defaultDuration = matches[0].duration;

        for (const item of scheduleItems) {
            if (item.orderIndex > lastOrderIndex + 1) {
                // This means we've skipped some order indices, so we handle the gap
                const skippedOrders = item.orderIndex - (lastOrderIndex + 1);
                const skippedTime = skippedOrders * defaultDuration * 60000; // Assuming each skipped order represents a fixed time gap (e.g., 60 minutes per order)

                currentTime = new Date(currentTime.getTime() + skippedTime);
            }

            if (item.type === 'gap') {
                // Gap: increase currentTime by gap duration
                const gapDuration = item.duration || 0;
                currentTime = new Date(currentTime.getTime() + gapDuration * 60000);
            } else if (item.type === 'match') {
                // Match: schedule match at currentTime
                const scheduledTime = new Date(currentTime.getTime());
                const matchDuration = item.duration || 0;

                // Update the match's scheduled time
                await prisma.match.update({
                    where: { id: item.id, statusId: 1 },
                    data: { scheduledTime }
                });

                // Advance currentTime by match duration
                currentTime = new Date(currentTime.getTime() + matchDuration * 60000);
            }
            lastOrderIndex = item.orderIndex;
        }
        console.log(`Match schedules updated successfully for pitch ID ${pitchId}.`);
    } catch (error) {
        console.error('Error updating match schedules:', error);
    }
};

// Helper function to check for time overlaps
const hasOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
    return start1 < end2 && start2 < end1;
};
// Helper function to get the earliest scheduled time on a pitch
const getPitchStartTime = async (pitchId: number): Promise<Date> => {
    // Fetch the earliest match
    const earliestMatch = await prisma.match.findFirst({
        where: { pitchId, statusId: 1 },
        orderBy: { scheduledTime: 'asc' }
    });

    // Fetch the earliest gap (if gaps have scheduledTime)
    const earliestGap = await prisma.gap.findFirst({
        where: { pitchId },
        orderBy: { scheduledTime: 'asc' }
    });

    const pitch = await getPitchById(pitchId);
    const event = await getEventById(pitch.eventId);

    let earliestTime: Date | null = null;
    earliestTime = event.startDate;
    return earliestTime;

    // if (earliestMatch && earliestGap) {
    //     earliestTime = earliestMatch.scheduledTime < earliestGap.scheduledTime ? earliestMatch.scheduledTime : earliestGap.scheduledTime;
    // } else if (earliestMatch) {
    //     earliestTime = earliestMatch.scheduledTime;
    // } else if (earliestGap) {
    //     earliestTime = earliestGap.scheduledTime;
    // }

    // if (earliestTime) {
    //     return earliestTime;
    // } else {
    //     // If no matches or gaps exist, define a default start time
    //     // You can set this to a predefined time or current time
    //     return new Date(); // For example, current time
    // }
};
