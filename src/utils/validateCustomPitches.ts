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
    console.log(matchCount, "//////matchCount");
    console.log(pitchNumber, "//////matchCount");
    
    const baseMatchesPerPitch = Math.ceil(matchCount / pitchNumber);
    console.log(baseMatchesPerPitch,"////////");
    
  
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
  