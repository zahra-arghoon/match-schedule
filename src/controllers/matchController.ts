import e, { Request, Response } from 'express';
import { getAllMatchs, moveMatch, findConflictingMatches } from '../services/matchService';
import {convertToISOString} from '../utils/timeConverter'
import { addGap,deleteGap,getGapByPitchId} from '../services/gapService';
import { getPitchById, getGroupedMatch } from '../services/pitchService';
import { PrismaClient } from '@prisma/client';
import {Match,Gap,Event} from '../interfaces/interface'
const prisma = new PrismaClient();

export const deleteAllMatchesController = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['SuperAdmin']
     */
    try {
    // Delete all matches
    await prisma.match.deleteMany({});
    
    // Send success response
    return res.status(200).json({ message: "All matches have been deleted successfully." });
    } catch (error) {
    // Handle any errors during deletion
    console.error('Error deleting all matches:', error);
    return res.status(500).json({ message: "Failed to delete matches." });
    }
};
export const getAllMatchsController = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['SuperAdmin']
     */
  try {
    const Matchs = await getAllMatchs();    
    res.status(200).json(Matchs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve Match configurations' });
  }
};

export const moveMatchController = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Match']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Match",
                 schema: { $ref: '#/definitions/MatchMove' }
             }
     */
    try {
        const { matchId, newOrderIndex, pitchIndex, extendPitchTime } = req.body;

        if (matchId === undefined || newOrderIndex === undefined || pitchIndex === undefined) {
            return res.status(400).json({ status: 'error', message: 'matchId, newOrderIndex, and pitchIndex are required.' });
        }

        const result = await moveMatch(matchId, newOrderIndex, pitchIndex, extendPitchTime);

        if (result.success) {
          return res.status(200).json({ status: 'success', message: result.message });
        } else {
          return res.status(400).json({ status: 'error', message: result.message });
        }
        // await moveMatch(matchId, newOrderIndex, pitchIndex);

        return res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        console.error('Error in moveMatchController:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
};
export const getPitchesWithMatchesAndGaps = async (req: Request, res: Response) => {
  /*
         #swagger.tags = ['Pitch']
     */
  try {
    const { id } = req.params;

    // Fetch all pitches with matches and gaps for the event
    const pitches = await prisma.pitch.findMany({
      where: { eventId: Number(id),statusId: 1 },
      include: {
        matches: true, // Include matches
        gaps: true,    // Include gaps
      },
      orderBy: {
        id: 'asc', // Order pitches by ID or any other field if necessary
      },
    });

    const events: Event[] = [];

    // Loop through each pitch
    for (const pitch of pitches) {
      // Combine matches and gaps, adding type property and sorting by orderIndex
      const combinedEvents: Event[] = [
        ...pitch.matches.map(match => ({
          ...match,
          type: 'match' as const,
          startTime: match.scheduledTime, // Adding startTime for matches
          endTime: new Date(match.scheduledTime.getTime() + (match.duration ?? 0) * 60000), // Calculating endTime
        })),
        ...pitch.gaps.map(gap => ({
          ...gap,
          type: 'gap' as const,
          startTime: gap.scheduledTime ?? new Date(), // Adding startTime for gaps; default to current date if not provided
          endTime: new Date((gap.scheduledTime ?? new Date()).getTime() + (gap.duration ?? 0) * 60000), // Calculating endTime
        })),
      ].sort((a, b) => {
        const orderIndexA = a.orderIndex ?? 0; // Default to 0 if null
        const orderIndexB = b.orderIndex ?? 0; // Default to 0 if null
        return orderIndexA - orderIndexB;
      });

      // Add combined events to the main array
      events.push(...combinedEvents);
    }

    // Group events by pitchId
    const groupedEvents = events.reduce((acc: Record<number, Event[]>, event: Event) => {
      const pitchId = event.pitchId ?? 0;
      if (!acc[pitchId]) {
        acc[pitchId] = [];
      }
      acc[pitchId].push(event);
      return acc;
    }, {});

    // Optionally, you can also sort events within each pitch group by orderIndex if needed
    for (const pitchId in groupedEvents) {
      groupedEvents[pitchId].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    }

    console.log(groupedEvents, "/////");

    res.status(200).json(groupedEvents);
  } catch (error) {
    console.error('Failed to fetch pitch schedule:', error);
    res.status(500).json({ error: 'Failed to fetch pitch schedule' });
  }
};
export const getPitches = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Match']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Match",
                 schema: { $ref: '#/definitions/Match' }
             }
     */
    try {
        const { id } = req.params;
        const matches = await getGroupedMatch(Number(id));

        return res.status(200).json({ data: matches, message: 'success' });
    } catch (error) {}
};

export const findConflictingMatchesController = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Match']
     */
    try {
      const { id } = req.params;
        const result = await findConflictingMatches(Number(id));
        return res.status(200).json({ data: result, message: 'success' });
      
    } catch (error) {
      console.log(error);
      
      
    }
            }