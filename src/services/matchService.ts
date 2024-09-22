import { PrismaClient } from '@prisma/client';
// import { getMatchById, getMatchByPitchId, getPitchById } from './path-to-your-repository-functions'; // Update with the actual path
import { getPitchById } from './pitchService';
import { getEventById } from './eventService';

const prisma = new PrismaClient();
interface Match {
    eventId: number ;
    team1Id: number;
    team2Id: number;
    groupId: number;
    pitchId: number;
    orderIndex: number;
    scheduledTime: Date;
    duration: number ;
}
export const createMatch = async (data:Match) => {
    try {
        const match = await prisma.match.create({
            data
        });
        return match;
    } catch (error) {
        console.error('Error creating match:', error);
        throw new Error('Failed to create match');
    }
};
export const getMatchByPitchId=async(pitchId:number,orderIndex:number|any)=>{

  return await prisma.match.findMany({
      where: {
        pitchId: pitchId,
        orderIndex: {
        gte: orderIndex,
      },
      },
      orderBy: {
        orderIndex: 'asc',  
      },
    });
  }
export const getOneMatchByPitchId=async(pitchId:number)=>{

  const match:any = await prisma.match.findFirst({
      where: {
        pitchId: pitchId,
      },
    });
    return match 
   
  }
export const getMatchesByEventId=async(eventId:number)=>{

  return await prisma.match.findMany({
      where: {
        eventId: eventId,
      },
      orderBy: {
        pitchId: 'asc',  
      },
    });
  }
  // Get all Match configurations
  export const getAllMatchs = async () => {
    try {
      return await prisma.match.findMany();
    } catch (error) {
      console.error('Error fetching all Matchs:', error);
      throw new Error('Failed to fetch Matchs');
    }
  };
  
// Get a single Match by ID
export const getMatchById = async (id: number) => {
    try {
      const Match = await prisma.match.findUnique({
        where: { id },
      });
  
      if (!Match) {
        return { status: "error", message: `Match configuration with ID ${id} not found` };
      }
  
      // Return the success response with the Match data
      return { status: "success", data: Match };
    } catch (error) {
      console.error(`Error fetching Match with ID ${id}:`, error);
      return { status: "error", message: "Failed to fetch Match configuration" };
    }
};
  
export const moveMatch = async (matchId: number, newOrderIndex: number, pitchIndex: number) => {
  try {
    // Find the match to be moved

    const mat = await getMatchById(matchId);
    const match = await prisma.match.findUniqueOrThrow({
      where: { id: matchId }
    });
    // Get the current pitch and orderIndex of the match
    const { pitchId, orderIndex, scheduledTime } = match;
    const order :any = orderIndex

    // Ensure the new pitchIndex is valid
    if (pitchIndex !== pitchId) {
      return { success: false, message: 'Match cannot be moved to a different pitch' };
    }
   
    // Retrieve all matches and gaps for the pitch

    if (order < newOrderIndex) {
      await prisma.match.updateMany({
        where: {
          pitchId: pitchIndex,
          orderIndex: {
            gt: order,
            lte: newOrderIndex
          }
        },
        data: {
          orderIndex: {
            decrement: 1
          }
        }
      });
    } else {
      await prisma.match.updateMany({
        where: {
          pitchId: pitchIndex,
          orderIndex: {
            gte: newOrderIndex,
            lt: order
          }
        },
        data: {
          orderIndex: {
            increment: 1
          }
        }
      });
    }

    // Update the moved match's new orderIndex
    await prisma.match.update({
      where: { id: matchId },
      data: {
        orderIndex: newOrderIndex
      }
    });

    await updateMatchSchedule(pitchId);

    return { success: true, message: 'Match moved and timings updated successfully' };
  } catch (error) {
    console.error('Error moving match:', error);
    return { success: false, message: 'Failed to move match' };
  }
};

const updateMatchSchedule = async (pitchIndex: number) => {
  try {
        const matches = await prisma.match.findMany({
          where: { pitchId: pitchIndex },
          orderBy: { orderIndex: 'asc' }
        });
        const gaps = await prisma.gap.findMany({
          where: { pitchId:pitchIndex },
          orderBy: { orderIndex: 'asc' },
        });
        
        const pitch = await getPitchById(pitchIndex);
        const event = await getEventById(pitch.eventId)
        const originalPitchDuration = event.startDate;
        let currentTime = new Date(originalPitchDuration); // Or use a specific start time based on your scheduling needs
    
          // Create a map for quick lookup of gaps by orderIndex
          const gapMap = new Map<number, number>(); // Map<orderIndex, duration>
          gaps.forEach(gap => gapMap.set(gap.orderIndex, gap.duration));
    
        for (let index = 0; index < matches.length; index++) {
          const match = matches[index];
          const duration = match.duration ?? 0; // Use 0 if duration is null or undefined
    
          // Calculate new scheduled time
          const gapDuration = gapMap.get(index + 1) ?? 0; // Assuming gaps are placed before the match
          currentTime = new Date(currentTime.getTime() + gapDuration * 60 * 1000); // Add gap duration in milliseconds
    
          // Calculate new scheduled time
          const newScheduledTime = new Date(currentTime.getTime());
    
          // Update the match's scheduled time
          await prisma.match.update({
            where: { id: match.id },
            data: { scheduledTime: newScheduledTime },
          });
          currentTime = new Date(currentTime.getTime() + duration * 60 * 1000); // Add match duration in milliseconds
    
        }
    console.log('Match schedules updated successfully.');
  } catch (error) {
    console.error('Error updating match schedules:', error);
  }
};


export const findConflictingMatches = async (eventId: number) => {
    try {
        const matches = await prisma.match.findMany({
            where: {
                eventId: eventId
            },
            include: {
                team1: true,
                team2: true
            },
            orderBy: {
                scheduledTime: 'asc'
            }
        });

        const conflicts: any[] = [];

        for (let i = 0; i < matches.length; i++) {
            const match1 = matches[i];
            const match1Duration = match1.duration ?? 0; // Use default if duration is null

            for (let j = i + 1; j < matches.length; j++) {
                const match2 = matches[j];
                const match2Duration = match2.duration ?? 0; // Use default if duration is null

                const match1EndTime = new Date(match1.scheduledTime);
                match1EndTime.setMinutes(match1EndTime.getMinutes() + match1Duration);

                const match2EndTime = new Date(match2.scheduledTime);
                match2EndTime.setMinutes(match2EndTime.getMinutes() + match2Duration);

                const isTimeOverlap = match1.scheduledTime < match2EndTime && match2.scheduledTime < match1EndTime;

                const isTeamConflict =
                    match1.team1Id === match2.team1Id ||
                    match1.team1Id === match2.team2Id ||
                    match1.team2Id === match2.team1Id ||
                    match1.team2Id === match2.team2Id;

                if (isTimeOverlap && isTeamConflict) {
                    conflicts.push({
                        match1: match1.id,
                        match2: match2.id,
                        conflictingTeam: match1.team1Id === match2.team1Id || match1.team1Id === match2.team2Id ? match1.team1Id : match1.team2Id
                    });
                }
            }
        }

        return conflicts.length > 0 ? { status: 'conflicts', conflicts } : { status: 'no conflicts', message: 'No conflicting matches found' };
    } catch (error) {
        console.error('Error finding conflicting matches:', error);
        return { status: 'error', message: 'Failed to find conflicting matches' };
    }
};




