import { Router } from 'express';
import {   getAllGroups,getGroupById,assignTeamRandomely,
    createGroup,updateGroup,deleteGroup
} from '../controllers/groupController';

const router: Router = Router();
import {validateCreateGroup,} from '../dto/validateGroup'
import {validateSchema} from '../middlewares/expressValidator'
import { isSuperAdmin } from '../middlewares/authHandler';

router.get('/groups/all', getAllGroups);


router.get('/groups/shuffle', assignTeamRandomely);


router.get('/groups/:id', getGroupById);


router.post('/groups', isSuperAdmin,validateCreateGroup, validateSchema, createGroup);


router.put('/groups/:id',isSuperAdmin, validateCreateGroup, validateSchema, updateGroup);


router.delete('/groups/:id',isSuperAdmin, deleteGroup);



export default router;