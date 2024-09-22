import { PrismaClient, Match } from '@prisma/client';
import { ITiming,IEvent } from '../interfaces/interface';
import { error } from 'console';
const prisma = new PrismaClient();

// Create a new pitch
export const createPitch = async (data:any) => {
    try {
      const pitch = await prisma.pitch.create({
        data,
      });
      return pitch;
    } catch (error) {
      console.error('Error creating pitch:', error);
      throw new Error('Failed to create pitch');
    }
  };
  
// Get all pitchs
export const getAllPitchs = async () => {
try {
    const pitchs = await prisma.pitch.findMany();
    return pitchs;
} catch (error) {
    console.error('Error fetching pitchs:', error);
    throw new Error('Failed to fetch pitchs');
}
};
// delete all pitchs
export const deleteAllPitchs = async () => {
  try {
    await prisma.pitch.deleteMany({});
  } catch (error) {
      console.error('Error deleting pitchs:', error);
      throw new Error('Failed to delete pitchs');
  }
};

// Get a single pitch by ID
export const getPitchById = async (id: number) => {
try {
    const pitch = await prisma.pitch.findUnique({
    where: { id }
    });
    if (!pitch) {
    throw new Error(`pitch with ID ${id} not found`);
    }
    return pitch;
} catch (error) {
    console.error(`Error fetching pitch with ID ${id}:`, error);
    throw new Error(`Failed to fetch pitch with ID ${id}`);
}
};

// Update an pitch by ID
export const updatePitch = async (id: number, data: { pitchId:number,orderIndex:number,duration:number }) => {
try {
    const pitch = await prisma.pitch.update({
    where: { id },
    data,
    });
    return pitch;
} catch (error) {
    console.error(`Error updating pitch with ID ${id}:`, error);
    throw new Error(`Failed to update pitch with ID ${id}`);
}
};

export const getGroupedMatch = async (eventId: number) => {
    try {
        // Fetch matches for a specific eventId
        const allMatches: Match[] = await prisma.match.findMany({
            where: { eventId: eventId }
        });

        // Group matches by pitchId and count the number of matches for each pitch
        const matchesGroupedByPitch = allMatches.reduce((groupedMatches, match) => {
            const pitchIndex = match.pitchId;

            if (pitchIndex !== null && pitchIndex !== undefined) {
                if (!groupedMatches[pitchIndex]) {
                    groupedMatches[pitchIndex] = {
                        count: 0,
                        matches: []
                    };
                }
                groupedMatches[pitchIndex].matches.push(match);
                groupedMatches[pitchIndex].count += 1; // Increment count
            }

            return groupedMatches;
        }, {} as Record<number, { matches: Match[]; count: number }>);


        // Optionally return the result
        return matchesGroupedByPitch;
    } catch (error) {
        console.error('Error grouping matches:', error);
        throw new Error('Failed to group matches');
    }
};