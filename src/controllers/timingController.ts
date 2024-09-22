import { Request, Response } from 'express';
import { createTiming, getAllTimings, getTimingById, updateTiming } from '../services/timingService';

export const createTimingController = async (req: Request, res: Response) => {
   /*
         #swagger.tags = ['Timing']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Timing",
                 schema: { $ref: '#/definitions/Timing' }
             }
     */
  try {
    const { gameTime, halfTime, gapTime } = req.body;
    const timing = await createTiming({ gameTime, halfTime, gapTime });
    res.status(201).json(timing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create timing configuration' });
  }
};

export const getAllTimingsController = async (req: Request, res: Response) => {
   /*
         #swagger.tags = ['Timing']
     */
  try {
    const timings = await getAllTimings();    
    res.status(200).json(timings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve timing configurations' });
  }
};

export const getTimingByIdController = async (req: Request, res: Response) => {
   /*
         #swagger.tags = ['Timing']
     */
  try {
    const { id } = req.params;
    const timing = await getTimingById(Number(id));
    if (!timing) return res.status(404).json({ error: 'Timing configuration not found' });
    res.status(200).json(timing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve timing configuration' });
  }
};

export const updateTimingController = async (req: Request, res: Response) => {
   /*
         #swagger.tags = ['Timing']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Timing",
                 schema: { $ref: '#/definitions/Timing' }
             }
     */
  try {
    const { id } = req.params;
    const { gameTime, halfTime, gapTime } = req.body;
    const timing = await updateTiming(Number(id), { gameTime, halfTime, gapTime });
    if (!timing) return res.status(404).json({ error: 'Timing configuration not found' });
    res.status(200).json(timing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update timing configuration' });
  }
};
