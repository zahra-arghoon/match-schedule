export const calculatePitchesNeeded = (matchesCount: number, gameTime: number, availableTime: number) => {  
    const matchesPerPitch = Math.floor(availableTime / gameTime);
    const pitchNumber =  Math.ceil(matchesCount / matchesPerPitch);
    if(matchesPerPitch <= 1){}
    return {pitchNumber,matchesPerPitch}
  };
  
  