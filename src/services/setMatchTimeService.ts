import { PrismaClient } from '@prisma/client';
import { ITiming,IEvent,IMatch } from '../interfaces/interface';
import {calculateMatchesPerPitch} from '../utils/validateCustomPitches'
// import {createOrUpdatePitches} from '../services/createOrUpdatePitches'
import { error } from 'console';
import { eventNames } from 'process';
// const prisma = new PrismaClient();
// import { PrismaClient } from '@prisma/client';
// import { calculateMatchesPerPitch } from '../utils/validateCustomPitches';
// import { createOrUpdatePitches } from './createOrUpdatePitches'; // Adjust import if necessary

const prisma = new PrismaClient();
// const checkForConflicts = async (team1Id:number, team2Id:number, scheduledTime:Date) => {
//     const conflictingMatches = await prisma.match.findMany({
//         where: {
//             OR: [
//                 { team1Id: team1Id, scheduledTime: scheduledTime },
//                 { team2Id: team2Id, scheduledTime: scheduledTime }
//             ]
//         }
//     });
//     return conflictingMatches.length > 0;
// };

const checkForConflicts = async (team1Id: number, team2Id: number, scheduledTime: Date, duration: number) => {
    const conflictingMatches = await prisma.match.findMany({
        where: {
            OR: [{ team1Id: team1Id }, { team2Id: team2Id }],
            AND: [
                {
                    scheduledTime: {
                        lte: new Date(scheduledTime.getTime() + duration * 60 * 1000) // Check if a match ends after this match's start
                    }
                },
                {
                    scheduledTime: {
                        gte: new Date(scheduledTime.getTime() - duration * 60 * 1000) // Check if a match starts before this match ends
                    }
                }
            ]
        }
    });

    return conflictingMatches.length > 0;
};
const generateTimeSlots = (startDate: Date, endDate: Date, gameTime: number) => {
    let slots: Date[] = [];
    let currentTime = new Date(startDate);

    while (currentTime.getTime() + gameTime * 60 * 1000 <= endDate.getTime()) {
        slots.push(new Date(currentTime));
        currentTime.setMinutes(currentTime.getMinutes() + gameTime); // Move by gameTime
    }
    return slots;
};

// export const scheduleMatches = async (eventId: number, matches: any[], startDate: Date, endDate: Date, pitchNumber: number, gameTime: number) => {
//     const allPitches = await prisma.pitch.findMany({ where: { eventId: eventId } });
//     const matchesPerPitchArray = calculateMatchesPerPitch(matches.length, pitchNumber); // Determine matches per pitch

//     // Create time slots for each pitch
//     let pitchTimeSlots: Date[][] = allPitches.map(() => generateTimeSlots(startDate, endDate, gameTime));
// console.log(allPitches);

//     let matchIndex = 0;

//     for (let i = 0; i < matchesPerPitchArray.length; i++) {
//         const matchesForPitch = matchesPerPitchArray[i]; // Number of matches for the current pitch

//         for (let j = 0; j < matchesForPitch && matchIndex < matches.length; j++) {
//             const match = matches[matchIndex];
//             const pitchId = allPitches[i].id;
//             let scheduled = false;

//             // Try to find a valid slot
//             for (let k = 0; k < pitchTimeSlots[i].length; k++) {
//                 const currentSlot = pitchTimeSlots[i][k];
//                 const hasConflict = await checkForConflicts(match.team1Id, match.team2Id, currentSlot, gameTime);

//                 if (!hasConflict) {
//                     // No conflict, schedule match in this slot
//                     await prisma.match.update({
//                         where: { id: match.id },
//                         data: {
//                             scheduledTime: currentSlot,
//                             pitchId: pitchId,
//                             duration: gameTime,
//                             orderIndex: j + 1 // Order within the pitch
//                         }
//                     });

//                     // Remove this slot from the list
//                     pitchTimeSlots[i].splice(k, 1);
//                     scheduled = true;
//                     break; // Stop searching for slots for this match
//                 }
//             }

//             if (!scheduled) {
//                 // Handle case where no valid slot could be found (e.g., raise an error or return)
//                 console.log(`No valid slot found for match ${match.id}.`);
//             }

//             // Move to the next match
//             matchIndex++;
//         }
//     }
// };
// export const scheduleMatches = async (
//     eventId: number, 
//     matches: any[], 
//     startDate: Date, 
//     endDate: Date,
//     pitchNumber: number, 
//     gameTime: number
//   ) => {
//       let pitchIndex = 1;
//       let matchIndex = 0;
  
//       // Update the event with the number of pitchNumber
//       const end = endDate.getTime()
//       const start =startDate.getTime() 
//       const availableTime = (end - start) / 1000 / 60;
//       await prisma.event.update({ 
//           where: { id: eventId }, 
//           data: { pitchNumber: pitchNumber, startDate: startDate, endDate: endDate } 
//       });

//       await createOrUpdatePitches(eventId, pitchNumber, availableTime);
//       const allPitches = await prisma.pitch.findMany({
//         where: { eventId: eventId }
//     });
  
//       // Calculate how many matches each pitch should handle
//       const matchesPerPitchArray = calculateMatchesPerPitch(matches.length, pitchNumber); // Use the function to get the match distribution
//     let pitchTimeSlots: Date[][] = allPitches.map(() => generateTimeSlots(startDate, endDate, gameTime));
// console.log(pitchTimeSlots);

//       // Iterate through each pitch and schedule matches
//       for (let i = 0; i < matchesPerPitchArray.length; i++) {
//           let currentTime = new Date(startDate); // Reset the current time for each pitch
//           const matchesForPitch = matchesPerPitchArray[i]; // Number of matches for the current pitch
  
//           // Schedule matches for this pitch
//         for (let j = 0; j < matchesForPitch && matchIndex < matches.length; j++) {
//             const match = matches[matchIndex];
//             const pitchId = allPitches[i].id;
//             let scheduled = false;

//             // Try to find a valid slot
//             for (let k = 1; k < pitchTimeSlots[i].length; k++) {
//                 const currentSlot = pitchTimeSlots[i][k];
//                 const hasConflict = await checkForConflicts(match.team1Id, match.team2Id, currentSlot, gameTime);

//                 if (!hasConflict) {
//                     // No conflict, schedule match in this slot
//                     await prisma.match.update({
//                         where: { id: match.id },
//                         data: {
//                             scheduledTime: currentSlot,
//                             pitchId: pitchId,
//                             duration: gameTime,
//                             orderIndex: j + 1 // Order within the pitch
//                         }
//                     });

//                     // Remove this slot from the list
//                     pitchTimeSlots[i].splice(k, 1);
//                     scheduled = true;
//                     break; // Stop searching for slots for this match
//                 }
//             }

//             if (!scheduled) {
//                 // Handle case where no valid slot could be found (e.g., raise an error or return)
//                 console.log(`No valid slot found for match ${match.id}.`);
//             }

//             // Move to the next match
//             matchIndex++;
//         }
  
//           // Move to the next pitch
//           pitchIndex++;
//           if (pitchIndex > pitchNumber) {
//               pitchIndex = 1; // Reset pitch index if we exceed the total number of pitchNumber
//           }
//       }
//   };

export const scheduleMatches = async (
    eventId: number, 
    matches: any[], 
    startDate: Date, 
    endDate: Date,
    pitchNumber: number, 
    gameTime: number
  ) => {
      let pitchIndex = 1;
      let matchIndex = 0;
  
      // Update the event with the number of pitchNumber
      const end = endDate.getTime()
      const start =startDate.getTime() 
      const availableTime = (end - start) / 1000 / 60;
      await prisma.event.update({ 
          where: { id: eventId }, 
          data: { pitchNumber: pitchNumber, startDate: startDate, endDate: endDate } 
      });

      await createOrUpdatePitches(eventId, pitchNumber, availableTime);
      const allPitches = await prisma.pitch.findMany({
        where: { eventId: eventId }
    });
  
      // Calculate how many matches each pitch should handle
      const matchesPerPitchArray = calculateMatchesPerPitch(matches.length, pitchNumber); // Use the function to get the match distribution
      console.log(matchesPerPitchArray,"/////////");
      
      // Iterate through each pitch and schedule matches
      for (let i = 0; i < matchesPerPitchArray.length; i++) {
          let currentTime = new Date(startDate); // Reset the current time for each pitch
          const matchesForPitch = matchesPerPitchArray[i]; // Number of matches for the current pitch
  
          // Schedule matches for this pitch
          for (let j = 0; j < matchesForPitch && matchIndex < matches.length; j++) {
              const match = matches[matchIndex];
              //
              const teamId = match.teamId; // Assuming match has a 
      let hasConflict = await checkForConflicts(match.team1Id, match.team2Id, currentTime, gameTime);
              console.log(hasConflict);
                 while (hasConflict) {
                     // Increment the time to the next available slot (this depends on how long you want to wait between conflicts)
                     currentTime.setMinutes(currentTime.getMinutes() + gameTime);

                     // Check for conflicts again at the new time
                     hasConflict = await checkForConflicts(match.team1Id, match.team2Id, currentTime, gameTime);
                 }

              // Assign the match to the current pitch and scheduled time
              await prisma.match.update({
                  where: { id: match.id },
                  data: {
                      scheduledTime: currentTime,
                      pitchId: allPitches[i].id,
                      duration:gameTime,
                      orderIndex: j + 1, // Order of the match within the pitch
                  },
              });

  
              // Increment the time by the total game time
              currentTime.setMinutes(currentTime.getMinutes() + gameTime);
  
              // Move to the next match
              matchIndex++;
          }
  
          // Move to the next pitch
          pitchIndex++;
          if (pitchIndex > pitchNumber) {
              pitchIndex = 1; // Reset pitch index if we exceed the total number of pitchNumber
          }
      }
  };

  
  export const createOrUpdatePitches = async (eventId: number, pitchNumber: number, availableTime: number) => {
    try {
      // Delete all existing pitches for the event
      await prisma.pitch.deleteMany({
        where: { eventId: eventId }
      });
  
      // Create the required number of new pitches with names
      const pitchesToCreate = Array.from({ length: pitchNumber }, (_, index) => ({
        eventId: eventId,
        duration: availableTime,
        name: `Pitch ${index + 1}` // Assign a name to each pitch
      }));
  
      console.log(pitchesToCreate.length);
      
      await prisma.pitch.createMany({
        data: pitchesToCreate
      });
  
      return { status: 'success', message: 'Pitches recreated successfully' };
    } catch (error) {
      console.error('Error creating or updating pitches:', error);
      return { status: 'error', message: 'Failed to recreate pitches' };
    }
  };
  
  


