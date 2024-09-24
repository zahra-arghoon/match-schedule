import { Router } from 'express';

import { addGapToMatchController, deleteGapController, moveGapController } from '../controllers/gapController';

import { validateGapAdd , validateDeleteGap,validateGapMove} from '../dto/validateGap';
import { validateSchema } from '../middlewares/expressValidator';

const router: Router = Router();

router.put('/gaps/add/gap', validateGapAdd,validateSchema,addGapToMatchController);
router.put('/gaps/delete/gap',validateDeleteGap,validateSchema, deleteGapController);
router.put('/gaps/move/gap', validateGapMove,validateSchema,moveGapController);


export default router;