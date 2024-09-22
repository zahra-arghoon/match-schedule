import { Router } from 'express';
import {
    getPitches,
    deleteAllMatchesController,
    moveMatchController,
    getPitchesWithMatchesAndGaps,
    getAllMatchsController,
    findConflictingMatchesController
    // moveMatchAtSamePitch
} from '../controllers/matchController';

import { validateEventId } from '../dto/validateEvent';
import { validateMatch } from '../dto/validateMatch';
import { validateSchema } from '../middlewares/expressValidator';

const router: Router = Router();

// Route to get all users
router.get('/pitches/:id', validateEventId, validateSchema, getPitchesWithMatchesAndGaps);

router.put('/matches/move',validateMatch,validateSchema, moveMatchController);
router.get('/matches', getAllMatchsController);
router.delete('/matches', deleteAllMatchesController);
router.get('/matches/:id', findConflictingMatchesController);



export default router;