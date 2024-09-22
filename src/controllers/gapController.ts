import { Request, Response } from 'express';
import { getAllMatchs, moveMatch } from '../services/matchService';
import { convertToISOString } from '../utils/timeConverter';
import { addGap, deleteGap, getGapByPitchId } from '../services/gapService';
import { getPitchById, getGroupedMatch } from '../services/pitchService';
import { PrismaClient } from '@prisma/client';
import { Match, Gap, Event } from '../interfaces/interface';
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
        const { orderIndex, pitchIndex, gapTime } = req.body;
        const { extendPitchTime = false } = req.body;

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
        const { oldOrderIndex, newOrderIndex, pitchIndex, newPitchIndex } = req.body;

        // Validate input
        if (oldOrderIndex === undefined || newOrderIndex === undefined || pitchIndex === undefined || newPitchIndex === undefined) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        // Get the gap duration to be used later
        const gap = await getGapByPitchId(pitchIndex, oldOrderIndex);
        if (!gap) {
            return res.status(404).json({ success: false, message: 'Gap not found' });
        }
        const duration = gap.duration ?? 0;

        // Step 1: Delete the existing gap
        const deleteResult = await deleteGap(oldOrderIndex, pitchIndex);
        if (!deleteResult.success) {
            return res.status(500).json({ success: false, message: deleteResult.message });
        }

        // Step 2: Add the new gap at the new position
        const addResult = await addGap(newOrderIndex, newPitchIndex, duration, true); // Assuming you want to extend pitch time
        if (addResult.status !== 'success') {
            return res.status(500).json({ success: false, message: addResult.message });
        }

        res.status(200).json({ success: true, message: 'Gap moved successfully' });
    } catch (error) {
        console.error('Error moving gap:', error);
        res.status(500).json({ success: false, message: 'Failed to move gap' });
    }
};