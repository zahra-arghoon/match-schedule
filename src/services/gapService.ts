import prisma from '../prisma';
import { ITeam,IGroup } from '../interfaces/interface';
import { getEventById } from './eventService';
import { getPitchById } from './pitchService';
import { getTimingById } from './timingService';
import { getMatchByPitchId,getOneMatchByPitchId } from './matchService';
import {convertToISOString} from '../utils/timeConverter'


export const deleteGap = async (orderIndex: number, pitchIndex: number) => {
  try {
    // Find the gap to be deleted
    const gap = await getGapByPitchId(pitchIndex, orderIndex);
    if (!gap) {
      return { success: false, message: 'Gap not found' };
    }

    const duration = gap.duration ?? 0;

    // Delete the gap
    await prisma.gap.delete({
      where: { id: gap.id }
    });

    // Retrieve matches and gaps that need to be updated
    const matches = await getMatchByPitchId(pitchIndex, orderIndex);
    const gaps = await getGapsByPitchId(pitchIndex, orderIndex);

    // Update the orderIndex and shift scheduledTime of matches
    if (matches.length > 0) {
      await prisma.match.updateMany({
        where: {
          pitchId: pitchIndex,
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
      await Promise.all(matches.map(async (match) => {
        if (match.scheduledTime && match.duration) {
          const newScheduledTime = new Date(match.scheduledTime.getTime() - duration * 60 * 1000); // Convert minutes to milliseconds
          await prisma.match.update({
            where: { id: match.id },
            data: { scheduledTime: newScheduledTime }
          });
        }
      }));
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
      where: { id: pitchIndex },
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
export const getGapsByPitchId=async(pitchId:number,orderIndex:number)=>{
    // try {
        
    // } catch (error) {
        
    // }
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
export const getGapByPitchId =async(pitchId:number,orderIndex:number)=>{
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
export const addGap = async (
  orderIndex: number,
  pitchIndex: number,
  duration: number,
  extendPitchTime: boolean
) => {
  try {
    const pitch = await getPitchById(pitchIndex);
    const originalPitchDuration = pitch.duration;
    const newPossiblePitchDuration = originalPitchDuration + duration;

    if (newPossiblePitchDuration > originalPitchDuration && !extendPitchTime) {
      // Return a special status indicating that extending the pitch time is required
      return { status: 'extend_required' };
    }

    if (newPossiblePitchDuration > originalPitchDuration && extendPitchTime) {
      // Extend the pitch duration
      await prisma.pitch.update({
        where: { id: pitchIndex },
        data: {
          duration: {
            increment: duration
          }
        }
      });
    }

    // Calculate the new gap start time
    const matches = await prisma.match.findMany({
      where: {
        pitchId: pitchIndex,
        orderIndex: {
          lte: orderIndex + 1 // Fetch matches up to and including the index after the new gap
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    const previousMatch = matches.find(match => match.orderIndex === orderIndex - 1);
    const nextMatch = matches.find(match => match.orderIndex === orderIndex);

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
      newScheduledTime = new Date();
    }

    // Create the new gap
    await createGap({
      pitchId: pitchIndex,
      orderIndex,
      duration,
      scheduledTime: newScheduledTime
    });

    // Get updated lists of matches and gaps
    const [updatedMatches, updatedGaps] = await Promise.all([
      getMatchByPitchId(pitchIndex, orderIndex),
      getGapsByPitchId(pitchIndex, orderIndex)
    ]);

    // Update matches and gaps orderIndex
    await updateMatchesAndGaps(pitchIndex, orderIndex, duration);

    return { status: 'success', message: 'Gap added and matches rescheduled successfully' };

  } catch (error) {
    console.error('Error adding gap:', error);
    return { status: 'error', message: 'Failed to add gap' };
  }
}; 
const createGap = async ({
  pitchId,
  orderIndex,
  duration,
  scheduledTime
}: {
  pitchId: number;
  orderIndex: number;
  duration: number;
  scheduledTime: Date;
}) => {
  return prisma.gap.create({
    data: {
      pitchId,
      orderIndex,
      duration,
      scheduledTime // Add this field
    }
  });
};
const updateMatchesAndGaps = async (pitchIndex: number, orderIndex: number, duration: number) => {
  // Update the orderIndex of matches
  await prisma.match.updateMany({
    where: {
      pitchId: pitchIndex,
      orderIndex: {
        gte: orderIndex
      }
    },
    data: {
      orderIndex: {
        increment: 1
      }
    }
  });

  // Shift the scheduled time of the matches
  const updatedMatches = await prisma.match.findMany({
    where: {
      pitchId: pitchIndex,
      orderIndex: {
        gte: orderIndex + 1
      }
    }
  });

  await Promise.all(
    updatedMatches.map(async (match) => {
      const newScheduledTime = new Date(
        match.scheduledTime.getTime() + duration * 60 * 1000 // Convert minutes to milliseconds
      );

      await prisma.match.update({
        where: { id: match.id },
        data: {
          scheduledTime: newScheduledTime
        }
      });
    })
  );

  // Update the orderIndex and scheduledTime of gaps after the new gap
  const updatedGaps = await prisma.gap.findMany({
    where: {
      pitchId: pitchIndex,
      orderIndex: {
        gt: orderIndex
      }
    }
  });

  await Promise.all(
    updatedGaps.map(async (gap) => {
      const newOrderIndex = gap.orderIndex + 1;
      const newScheduledTime = new Date(
        gap.scheduledTime.getTime() + duration * 60 * 1000 // Convert minutes to milliseconds
      );

      await prisma.gap.update({
        where: { id: gap.id },
        data: {
          orderIndex: newOrderIndex,
          scheduledTime: newScheduledTime // Update scheduledTime
        }
      });
    })
  );
};

 
