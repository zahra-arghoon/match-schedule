import { Router } from 'express';
import { getAllEventsController, getEventByIdController, customScheduleController,updateEventTimingController,scheduleController,deleteAllEventsController} from '../controllers/eventController';
import { validateCreateEvent, validateUpdateEvent, validateEventId } from '../dto/validateEvent';
import {validateCreateTiming} from '../dto/validateTiming'
import {validateSchema} from '../middlewares/expressValidator'
import { isSuperAdmin } from '../middlewares/authHandler';

const router = Router();


router.get('/events', getAllEventsController);


router.get('/events/schedule/matches', scheduleController);


router.get('/events/:id', validateEventId,validateSchema,getEventByIdController);


router.put('/events/:id', validateUpdateEvent, validateSchema, customScheduleController);


router.put('/events/addTiming/:id', validateEventId,validateCreateTiming, validateSchema, updateEventTimingController);


router.delete('/events',isSuperAdmin, deleteAllEventsController);



export default router;
