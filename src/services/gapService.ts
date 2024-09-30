import prisma from '../prisma';
import { getMatchByPitchId, getOneMatchByPitchId } from './matchService';
import {checkPitchAvailability } from '../utils/validateCustomPitches';
export const getGapsByPitchId = async (pitchId: number, orderIndex: number) => {
    return await prisma.match.findMany({
        where: {
            pitchId: pitchId,
            statusId: 1,
            orderIndex: {
                gte: orderIndex
            }
        },
        orderBy: {
            orderIndex: 'asc'
        }
    });
};
export const getGapByPitchId = async (pitchId: number, orderIndex: number) => {
    try {
        const gap = await prisma.gap.findFirst({
            where: {
                pitchId: pitchId,
                orderIndex: orderIndex
            }
        });
        return gap;
    } catch (error) {
        console.error(`Gap with pitchId ${pitchId} and orderIndex ${orderIndex} not found`);
        throw new Error(`Gap with pitchId ${pitchId} and orderIndex ${orderIndex} not found`);
    }
};
export const deleteGap = async (orderIndex: number, pitchIndex: number) => {
    try {
        // Find the gap to be deleted
        const gap = await getGapByPitchId(pitchIndex, orderIndex);
        if (!gap) {
            return { success: false, message: 'Gap not found' };
        }

        const duration = gap.duration ?? 0;
        // Retrieve matches and gaps that need to be updated
        const matches = await getMatchByPitchId(pitchIndex, orderIndex);
        const gaps = await getGapsByPitchId(pitchIndex, orderIndex);

        //////////////////////////////////////////
        // Step 1: Check for conflicts with team schedules
        for (const match of matches) {
            const teamsInMatch = [match.team1Id, match.team2Id];

            // Query for other matches involving these teams that might now conflict
            const conflictingMatches = await prisma.match.findMany({
                where: {
                    OR: [{ team1Id: { in: teamsInMatch } }, { team2Id: { in: teamsInMatch } }],
                    scheduledTime: {
                        // Check for overlap with the rescheduled time of this match
                        gte: match.scheduledTime, // New scheduled time of the match after deleting the gap
                        lt: new Date(match.scheduledTime.getTime() + match.duration * 60 * 1000) // Adjust for match duration
                    },
                    id: { not: match.id }, // Exclude the current match itself
                    eventId: match.eventId // Exclude the current match itself
                }
            });
            // if (conflictingMatches.length > 0) {
            //     // Conflict detected
            //     return {
            //         success: false,
            //         message: `Conflict detected for match ${match.id} involving teams ${teamsInMatch.join(
            //             ', '
            //         )}. Conflicts with other matches: ${conflictingMatches.map((cMatch) => cMatch.id).join(', ')}`
            //     };
            // }
        }

        // Step 2: Delete the gap if no conflicts were found
        await prisma.gap.delete({
            where: { id: gap.id }
        });
        //////////////////////////////////////////
        // Update the orderIndex and shift scheduledTime of matches
        if (matches.length > 0) {
            await prisma.match.updateMany({
                where: {
                    pitchId: pitchIndex,
                    statusId: 1,
                    orderIndex: {
                        gte: orderIndex
                    }
                },
                data: {
                    orderIndex: {
                        decrement: 1
                    }
                }
            });

            // Update scheduledTime for each match
            await Promise.all(
                matches.map(async (match) => {
                    if (match.scheduledTime && match.duration) {
                        const newScheduledTime = new Date(match.scheduledTime.getTime() - duration * 60 * 1000); // Convert minutes to milliseconds
                        await prisma.match.update({
                            where: { id: match.id, statusId: 1 },
                            data: { scheduledTime: newScheduledTime }
                        });
                    }
                })
            );
        }

        // Update the orderIndex of gaps after the deleted gap
        if (gaps.length > 0) {
            await prisma.gap.updateMany({
                where: {
                    pitchId: pitchIndex,
                    orderIndex: {
                        gt: orderIndex
                    }
                },
                data: {
                    orderIndex: {
                        decrement: 1
                    }
                }
            });
        }

        // Optionally, adjust the pitch duration if needed
        await prisma.pitch.update({
            where: { id: pitchIndex, statusId: 1 },
            data: {
                duration: {
                    decrement: duration
                }
            }
        });

        return { success: true, message: 'Gap deleted successfully' };
    } catch (error) {
        console.error('Error deleting gap:', error);
        return { success: false, message: 'Failed to delete gap' };
    }
};
export const addGap = async (orderIndex: number, pitchIndex: number, duration: number, extendPitchTime: boolean) => {
    try {
        // Calculate the new gap start time
        const matches = await prisma.match.findMany({
            where: {
                pitchId: pitchIndex,
                statusId: 1,
                orderIndex: {
                    lte: orderIndex + 1 // Fetch matches up to and including the index after the new gap
                }
            },
            orderBy: { orderIndex: 'asc' }
        });

        const previousMatch = matches.find((match) => match.orderIndex === orderIndex - 1);
        const nextMatch = matches.find((match) => match.orderIndex === orderIndex);

        let newScheduledTime;
        if (previousMatch) {
            // Schedule the gap right after the previous match
            const previousMatchDuration = previousMatch.duration ?? 0; // Default to 0 if null

            newScheduledTime = new Date(previousMatch.scheduledTime.getTime() + previousMatchDuration * 60 * 1000);
        } else if (nextMatch) {
            // Schedule the gap at the start of the next match if no previous match exists
            newScheduledTime = new Date(nextMatch.scheduledTime.getTime() - duration * 60 * 1000);
        } else {
            // Schedule the gap at the start of the pitch if there are no matches
            //complete here
            newScheduledTime = new Date();
        }

        // Step 1: Retrieve affected matches that will be rescheduled due to the new gap
        const affectedMatches = await prisma.match.findMany({
            where: {
                pitchId: pitchIndex,
                orderIndex: {
                    gte: orderIndex // Affects matches after the gap
                },
                statusId: 1
            },
            orderBy: { scheduledTime: 'asc' }
        });
        const affectedTeamIds = affectedMatches.flatMap((match) => [match.team1Id, match.team2Id]);

        // Step 3: Check if any of the affected teams have conflicting matches at the new scheduled times
        for (const match of affectedMatches) {
            const teamsInMatch = [match.team1Id, match.team2Id];

            // Query for any other matches involving these teams that might conflict
            const conflictingMatches = await prisma.match.findMany({
                where: {
                    OR: [{ team1Id: { in: teamsInMatch } }, { team2Id: { in: teamsInMatch } }],
                    scheduledTime: {
                        // Check for overlap with the new rescheduled time of the match
                        gte: match.scheduledTime,
                        lt: new Date(match.scheduledTime.getTime() + (match.duration + duration) * 60 * 1000) // Adjust for new duration
                    },
                    id: { not: match.id }, // Exclude the current match itself
                    pitchId: { not: match.pitchId }, // Exclude the current match itself
                    statusId: 1,
                    eventId: match.eventId
                }
            });
                      
           if (conflictingMatches.length > 0) {
               // Prepare detailed conflict information
               const conflictDetails = conflictingMatches
                   .map((conflictingMatch) => {
                       return `Match ID: ${conflictingMatch.id}, Scheduled Time: ${conflictingMatch.scheduledTime.toISOString()}, Duration: ${
                           conflictingMatch.duration
                       } mins, order Index: ${conflictingMatch.orderIndex},Pitch ID: ${conflictingMatch.pitchId}, Teams: ${conflictingMatch.team1Id} vs ${
                           conflictingMatch.team2Id
                       }`;
                   })
                   .join('\n');

               // Return conflict status with detailed information
               return {
                   status: 'conflict',
                   message: `Conflict detected for match ${match.id} involving teams ${teamsInMatch.join(
                       ', '
                   )} with the following conflicting matches:\n${conflictDetails}`
               };
           }
        }

        const pitchAvailability = await checkPitchAvailability(pitchIndex, duration, extendPitchTime);

        if (pitchAvailability.status === 'extend_required') {
            return { success: false, message: 'Pitch duration needs to be extended to accommodate the match' };
        }

        if (pitchAvailability.status === 'extended') {
            console.log('Pitch duration extended successfully');
        }

      

        // Update matches and gaps orderIndex
        await updateMatchesAndGaps(pitchIndex, orderIndex, duration,newScheduledTime);

        return { status: 'success', message: 'Gap added and matches rescheduled successfully' };
    } catch (error) {
        console.error('Error adding gap:', error);
        return { status: 'error', message: 'Failed to add gap' };
    }
};
const updateMatchesAndGaps = async (pitchIndex: number, orderIndex: number, duration: number,newScheduledTime:Date) => {
    // Step 1: First, shift all matches and gaps with orderIndex >= orderIndex before adding the new gap

    await prisma.match.updateMany({
        where: {
            pitchId: pitchIndex,
            statusId: 1,
            orderIndex: {
                gte: orderIndex // Push all matches with orderIndex >= 2 forward
            }
        },
        data: {
            orderIndex: {
                increment: 1 // Increment the orderIndex by 1
            }
        }
    });

    await prisma.gap.updateMany({
        where: {
            pitchId: pitchIndex,
            orderIndex: {
                gte: orderIndex // Push all gaps with orderIndex >= 2 forward
            }
        },
        data: {
            orderIndex: {
                increment: 1 // Increment the orderIndex by 1
            }
        }
    });

    // Step 2: Now, insert the new gap at the original orderIndex (2)

    const newGap = await prisma.gap.create({
        data: {
            pitchId: pitchIndex,
            orderIndex, // This is the orderIndex where you are adding the new gap (e.g., 2)
            duration,
            scheduledTime: newScheduledTime // Calculated before
        }
    });

    // Step 3: Adjust the scheduled time of all gaps and matches that have been pushed forward
    const updatedMatches = await prisma.match.findMany({
        where: {
            pitchId: pitchIndex,
            statusId: 1,
            orderIndex: {
                gt: orderIndex // Only update matches after the new gap
            }
        }
    });

    await Promise.all(
        updatedMatches.map(async (match) => {
            const newScheduledTime = new Date(
                match.scheduledTime.getTime() + duration * 60 * 1000 // Shift by the duration of the gap
            );

            await prisma.match.update({
                where: { id: match.id, statusId: 1 },
                data: {
                    scheduledTime: newScheduledTime
                }
            });
        })
    );

    // Step 4: Similarly, update the scheduled time of the gaps that were pushed forward
    const updatedGaps = await prisma.gap.findMany({
        where: {
            pitchId: pitchIndex,
            orderIndex: {
                gt: orderIndex // Only update gaps after the new gap
            }
        }
    });

    await Promise.all(
        updatedGaps.map(async (gap) => {
            const newScheduledTime = new Date(
                gap.scheduledTime.getTime() + duration * 60 * 1000 // Shift by the duration of the gap
            );

            await prisma.gap.update({
                where: { id: gap.id },
                data: {
                    scheduledTime: newScheduledTime // Update scheduledTime
                }
            });
        })
    );
};
