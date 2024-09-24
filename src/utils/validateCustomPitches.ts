import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
interface ValidationResult {
    valid: boolean;
    message: string;
  }
  
export const validateCustomPitches = (
    pitchNumber: number =4,
    matchCount: number,
    totalGameTime: number,
    availableTime: number
  ): ValidationResult => {
        const timePerPitch = availableTime ;
        

        const matchesPerPitch = Math.floor(timePerPitch / totalGameTime);
        const minGamesPerPitch = Math.ceil(matchCount / pitchNumber);
        const totalMatchesCapacity = matchesPerPitch * pitchNumber;
        

       // Check if the total matches can fit on the available pitches within the available time
       if (totalMatchesCapacity >= matchCount && minGamesPerPitch <= matchesPerPitch) {
        return {
          valid: true,
          message: 'Valid: The matches can fit on the given number of pitches.'
        };
      } else {
        let message = 'Invalid: ';
        
        if (totalMatchesCapacity < matchCount) {
          message += `Not enough time or pitches to schedule all matches. You need more pitches or more available time. `;
        }
    
        if (minGamesPerPitch > matchesPerPitch) {
          message += `Each pitch is required to handle more matches than possible within the available time.`;
        }
      
    
        return {
          valid: false,
          message
        };
    }  
   

}


export const calculateMatchesPerPitch = (matchCount: number, pitchNumber: number): number[] => {
    // Calculate how many matches each pitch will handle (base number)

    const baseMatchesPerPitch = Math.floor(matchCount / pitchNumber);    
  
    // Calculate how many matches are left after distributing evenly
    const remainingMatches = matchCount % pitchNumber;
  
    // Create an array to store the number of matches for each pitch
    const matchesPerPitchArray = Array(pitchNumber).fill(baseMatchesPerPitch);
  
    // Distribute the remaining matches across the first few pitches
    for (let i = 0; i < remainingMatches; i++) {
      matchesPerPitchArray[i]++;
    }
  
    return matchesPerPitchArray;
  };
  export const checkPitchAvailability = async (newPitchIndex: number, matchDuration: number, extendPitchTime: boolean) => {
      // Step 1: Fetch the current duration of the pitch (valid total duration for the pitch)
      const pitch = await prisma.pitch.findUniqueOrThrow({
          where: { id: newPitchIndex, statusId: 1 },
          select: { duration: true } // The current allowed total duration for the pitch
      });

      const originalPitchDuration = pitch.duration; // The current allowed total duration for the pitch

      // Step 2: Get the total duration of all scheduled matches on the pitch
      const totalMatchDuration = await prisma.match.aggregate({
          where: {
              pitchId: newPitchIndex,
              statusId: 1
          },
          _sum: {
              duration: true // Assuming the match duration is stored in minutes
          }
      });

      const scheduledMatchDuration = totalMatchDuration._sum.duration ?? 0; // Total match duration or 0 if no matches

      // Step 3: Get the total duration of all gaps on the pitch
      const totalGapDuration = await prisma.gap.aggregate({
          where: {
              pitchId: newPitchIndex
          },
          _sum: {
              duration: true // Assuming the gap duration is stored in minutes
          }
      });

      const scheduledGapDuration = totalGapDuration._sum.duration ?? 0; // Total gap duration or 0 if no gaps

      // Step 4: Calculate the new total pitch duration (matches + gaps + new match)
      const totalScheduledDuration = scheduledMatchDuration + scheduledGapDuration; // Total scheduled time for matches and gaps
      const newPossiblePitchDuration = totalScheduledDuration + matchDuration; // New total if the match is added

      // Step 5: Check if the new duration exceeds the current pitch duration
      if (newPossiblePitchDuration > originalPitchDuration) {
          // If extending the pitch time is not allowed, return the 'extend_required' status
          if (!extendPitchTime) {
              return { status: 'extend_required' };
          }

          // If extending the pitch time is allowed, update the pitch's duration
          await prisma.pitch.update({
              where: { id: newPitchIndex, statusId: 1 },
              data: {
                  duration: {
                      increment: matchDuration // Extend the pitch duration to accommodate the new match
                  }
              }
          });

          return { status: 'extended', message: 'Pitch duration extended to accommodate the new match' };
      }

      // If the match can fit without extending the duration, return success
      return { status: 'available', message: 'Pitch can accommodate the new match without extending time' };
  };


