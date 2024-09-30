type TimeSlot = {
    time: string;
    pitchNumber: number;
    orderindex: number;
};
type InsideMatch = { team1: number; team2: number; groupId: number };

type ScheduledItem = {
    time: string;
    pitchNumber: number;
    orderindex: number;
    team1: number;
    team2: number;
    groupId: number;
};
export const realSchedule = (availableTimes: string[][], groupMatches: InsideMatch[][]): ScheduledItem[] => {
    let scheduledMatches: ScheduledItem[] = [];

    try {
        // Flatten available times with pitch numbers and orderindex
        let availableTimeSlots: TimeSlot[] = [];
        for (let pitchNumber = 0; pitchNumber < availableTimes.length; pitchNumber++) {
            for (let timeIndex = 0; timeIndex < availableTimes[pitchNumber].length; timeIndex++) {
                let time = availableTimes[pitchNumber][timeIndex];
                availableTimeSlots.push({
                    time,
                    pitchNumber,
                    orderindex: timeIndex
                });
            }
        }

        // Flatten all matches into a single array
        let allMatches: InsideMatch[] = groupMatches.flat();

        // Copy of matches to schedule and available time slots
        let matchesToSchedule: InsideMatch[] = [...allMatches];
        let timeSlotsToUse: TimeSlot[] = [...availableTimeSlots];

        let matchesWithConflict: InsideMatch[] = [];

        // Initial scheduling attempt
        for (let match of matchesToSchedule) {
            let scheduled = false;

            for (let i = 0; i < timeSlotsToUse.length; i++) {
                let timeSlot = timeSlotsToUse[i];
                let scheduledItem: ScheduledItem = {
                    time: timeSlot.time,
                    pitchNumber: timeSlot.pitchNumber,
                    orderindex: timeSlot.orderindex,
                    team1: match.team1,
                    team2: match.team2,
                    groupId: match.groupId
                };

                let conflictsArray = findConflicts(scheduledItem, scheduledMatches);

                if (conflictsArray.length === 0) {
                    scheduledMatches.push(scheduledItem);
                    timeSlotsToUse.splice(i, 1); // Remove used time slot
                    scheduled = true;
                    break;
                }
            }

            if (!scheduled) {
                // Add to matchesWithConflict for later scheduling
                matchesWithConflict.push(match);
            }
        }

        // Attempt to schedule matches with conflicts
        for (let match of matchesWithConflict) {
            let scheduled = false;

            for (let i = 0; i < timeSlotsToUse.length; i++) {
                let timeSlot = timeSlotsToUse[i];
                let scheduledItem: ScheduledItem = {
                    time: timeSlot.time,
                    pitchNumber: timeSlot.pitchNumber,
                    orderindex: timeSlot.orderindex,
                    team1: match.team1,
                    team2: match.team2,
                    groupId: match.groupId
                };

                let conflictsArray = findConflicts(scheduledItem, scheduledMatches);

                if (conflictsArray.length === 0) {
                    scheduledMatches.push(scheduledItem);
                    timeSlotsToUse.splice(i, 1);
                    scheduled = true;
                    break;
                }
            }

            if (!scheduled) {
                // Attempt to swap time slots with already scheduled matches
                for (let j = 0; j < scheduledMatches.length; j++) {
                    let scheduledMatch = scheduledMatches[j];
                    let potentialSwapItem: ScheduledItem = {
                        time: scheduledMatch.time,
                        pitchNumber: scheduledMatch.pitchNumber,
                        orderindex: scheduledMatch.orderindex,
                        team1: match.team1,
                        team2: match.team2,
                        groupId: match.groupId
                    };

                    // Check if match can be scheduled at scheduledMatch's time slot
                    let conflictsWithPotentialSwap = findConflicts(
                        potentialSwapItem,
                        scheduledMatches.filter((m, index) => index !== j)
                    );

                    if (conflictsWithPotentialSwap.length === 0) {
                        // Now, see if the scheduledMatch can be moved to any other available time slot
                        for (let k = 0; k < timeSlotsToUse.length; k++) {
                            let newTimeSlot = timeSlotsToUse[k];
                            let potentialRescheduleItem: ScheduledItem = {
                                time: newTimeSlot.time,
                                pitchNumber: newTimeSlot.pitchNumber,
                                orderindex: newTimeSlot.orderindex,
                                team1: scheduledMatch.team1,
                                team2: scheduledMatch.team2,
                                groupId: scheduledMatch.groupId
                            };

                            let conflictsWithReschedule = findConflicts(
                                potentialRescheduleItem,
                                scheduledMatches.filter((m, index) => index !== j)
                            );

                            if (conflictsWithReschedule.length === 0) {
                                // Perform the swap
                                scheduledMatch.time = newTimeSlot.time;
                                scheduledMatch.pitchNumber = newTimeSlot.pitchNumber;
                                scheduledMatch.orderindex = newTimeSlot.orderindex;

                                // Remove the new time slot as it's now used
                                timeSlotsToUse.splice(k, 1);

                                // Schedule the potentialSwapItem
                                scheduledMatches.push(potentialSwapItem);

                                scheduled = true;
                                break;
                            }
                        }
                    }

                    if (scheduled) {
                        break;
                    }
                }

                if (!scheduled) {
                    // If unable to schedule, throw an error
                    throw new Error(`Unable to schedule match between team ${match.team1} and team ${match.team2}`);
                }
            }
        }

        // Return the scheduled matches
        return scheduledMatches;
    } catch (error) {
        console.error('Error in scheduling:', error);
        // Return an empty array to maintain consistent return type
        return [];
    }
};
const findConflicts = (scheduledItem: ScheduledItem, scheduledMatches: ScheduledItem[]): ScheduledItem[] => {
    let arr: ScheduledItem[] = [];
    scheduledMatches.forEach((match) => {
        if (
            scheduledItem.time === match.time &&
            (scheduledItem.team1 === match.team1 ||
                scheduledItem.team1 === match.team2 ||
                scheduledItem.team2 === match.team1 ||
                scheduledItem.team2 === match.team2)
        ) {
            arr.push(match);
        }
    });
    return arr;
};