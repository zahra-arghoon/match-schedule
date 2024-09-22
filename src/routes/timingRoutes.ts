import { Router } from 'express';
import { createTimingController, getAllTimingsController, getTimingByIdController, updateTimingController } from '../controllers/timingController';
import { validateCreateTiming, validateTimeId } from '../dto/validateTiming';
import {validateSchema} from '../middlewares/expressValidator'
const router = Router();


router.post('/timings', createTimingController);


router.get('/timings', getAllTimingsController);


router.get('/timings/:id', validateTimeId, validateSchema, getTimingByIdController);


router.put('/timings/:id',validateTimeId,validateSchema, updateTimingController);

export default router;
