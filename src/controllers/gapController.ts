import { Request, Response } from 'express';
import { getAllMatchs, moveMatch } from '../services/matchService';
import { convertToISOString } from '../utils/timeConverter';
import { addGap, deleteGap, getGapByPitchId } from '../services/gapService';
import { getPitchById, getGroupedMatch } from '../services/pitchService';
import { PrismaClient } from '@prisma/client';
import { Match, Gap, Event } from '../interfaces/interface';
import { log } from 'util';
const prisma = new PrismaClient();
export const addGapToMatchController = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['GapMatch']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Match",
                 schema: { $ref: '#/definitions/MatchAddGap' }
             }
     */
    try {
        const { orderIndex, pitchIndex, gapTime, extendPitchTime = false } = req.body;

        // Validate required fields
        if (pitchIndex === undefined || gapTime === undefined) {
            return res.status(400).json({ status: 'error', message: 'orderIndex, pitchIndex, and gapTime are required.' });
        }

        // Call the addGap function
        const result = await addGap(orderIndex, pitchIndex, gapTime, extendPitchTime);

        // Handle different results
        if (result.status === 'success') {
            return res.status(200).json({ status: 'success', message: result.message });
        } else if (result.status === 'extend_required') {
            return res.status(400).json({
                status: 'error',
                message: 'Adding the gap exceeds the pitch end time. You may need to extend the pitch time to apply this gap.'
            });
        } else {
            return res.status(500).json({ status: 'error', message: result.message });
        }
    } catch (error) {
        console.error('Error in addGapToMatchController:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
};

export const deleteGapController = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['GapMatch']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Match",
                 schema: { $ref: '#/definitions/MatchDelGap' }
             }
     */
    try {
        const { pitchIndex, orderIndex } = req.body;

        // Validate required fields
        if (pitchIndex === undefined || orderIndex === undefined) {
            return res.status(400).json({ status: 'error', message: 'pitchIndex and orderIndex are required.' });
        }

        const result = await deleteGap(orderIndex, pitchIndex);

        if (result.success) {
            return res.status(200).json({ status: 'success', message: result.message });
        } else {
            return res.status(500).json({ status: 'error', message: result.message });
        }
    } catch (error) {
        console.error('Error in deleteGapController:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
};

export const moveGapController = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['GapMatch']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Match",
                 schema: { $ref: '#/definitions/MoveGap' }
             }
     */
    try {
        const { oldOrderIndex, newOrderIndex, pitchIndex, newPitchIndex, extendPitchTime = false } = req.body;

        // Validate required fields
        if (oldOrderIndex === undefined || newOrderIndex === undefined || pitchIndex === undefined || newPitchIndex === undefined) {
            return res.status(400).json({ status: 'error', message: 'oldOrderIndex, newOrderIndex, pitchIndex, and newPitchIndex are required.' });
        }

        // Get the gap duration to be used later
        const gap = await getGapByPitchId(pitchIndex, oldOrderIndex);
        if (!gap) {
            return res.status(404).json({ status: 'error', message: 'Gap not found' });
        }
        const duration = gap.duration ?? 0;

        const addResult = await addGap(newOrderIndex, newPitchIndex, duration, extendPitchTime); // Assuming you want to extend pitch time
        if (addResult.status !== 'success') {
            return res.status(500).json({ status: 'error', message: addResult.message });
        }
        const deleteResult = await deleteGap(oldOrderIndex, pitchIndex);
        if (!deleteResult.success) {
            return res.status(500).json({ status: 'error', message: deleteResult.message });
        }


        return res.status(200).json({ status: 'success', message: 'Gap moved successfully' });
    } catch (error) {
        console.error('Error moving gap:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to move gap' });
    }
};

