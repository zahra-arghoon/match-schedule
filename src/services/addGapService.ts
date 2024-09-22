import prisma from '../prisma';
import { ITeam,IGroup } from '../interfaces/interface';
import { getEventById } from './eventService';
import { getTimingById } from './timingService';
import {convertToISOString} from '../utils/timeConverter'
// Function to shift subsequent matches on the same pitch

// async function moveToDifferentPitch(match: any, newPitchIndex: number, newTime: Date, team1Id: number, team2Id: number) {
//   // Fetch matches on the target pitch
//   const targetPitchMatches = await prisma.match.findMany({
//     where: { pitchIndex: newPitchIndex },
//     orderBy: { scheduledTime: 'asc' },
//   });

//   const originalPitchIndex = match.pitchIndex;
//         const originalTime = match.scheduledTime;

  
// const conflictingMatches = await prisma.match.findMany({
//   where: {
//       OR: [
//           { team1Id: team1Id },
//           { team1Id: team2Id },
//           { team2Id: team1Id },
//           { team2Id: team2Id }
//       ],
//       scheduledTime: newTime,
//       AND: [
//           {
//               id: {
//                   not: match.id // Directly exclude the match by its ID
//               }
//           },
//           {
//               pitchIndex: {
//                   not: newPitchIndex // Additionally ensure it is not considered if on the new pitch
//               }
//           }
//       ]
//   }
// });

//   console.log(conflictingMatches);

//   // if (conflictingMatches.length > 0) {
//   //     //handle red errors on figma
//   //   throw new Error('Conflict detected: One or both teams are already scheduled for a match at that time.');
//   // }

//    // Update the match to the new time and pitch
//    await prisma.match.update({
//     where: { id: match.id },
//     data: {
//         scheduledTime: newTime,
//         pitchIndex: newPitchIndex
//     }
// });

//  // Adjust subsequent matches on the new pitch
//  await adjustMatchesOnPitch(newPitchIndex, newTime);

//  // Adjust matches on the original pitch if the pitch has changed
//  if (originalPitchIndex !== newPitchIndex) {
//      await adjustMatchesOnPitch(originalPitchIndex, originalTime);
//  };
// return 'Match moved successfully and schedules adjusted.';

// }
// async function adjustMatchesOnPitch(pitchIndex:number, startTime:Date) {
//   console.log(pitchIndex,startTime);
  
//   const matches = await prisma.match.findMany({
//       where: {
//           pitchId: pitchIndex,
//           scheduledTime: { gt: startTime }
//       },
//       orderBy: { scheduledTime: 'asc' }
//   });
//   console.log(matches,"/////");
  

//   let lastScheduledTime = new Date(startTime);
//   for (const match of matches) {
//       lastScheduledTime = new Date(lastScheduledTime.getTime() + 120 * 60000); // Assuming 90 minutes per match

//       const ff =await prisma.match.update({
//           where: { id: match.id },
//           data: { scheduledTime: lastScheduledTime }
//       });
//       console.log(ff,".....................");
      
//   }
// }
  