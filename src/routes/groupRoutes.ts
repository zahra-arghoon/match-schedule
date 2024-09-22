import { Router } from 'express';
import {   getAllGroups,getGroupById,assignTeamRandomely,
    createGroup,updateGroup,deleteGroup
} from '../controllers/groupController';

const router: Router = Router();
import {validateCreateGroup,} from '../dto/validateGroup'
import {validateSchema} from '../middlewares/expressValidator'

router.get('/groups/all', getAllGroups);


router.get('/groups/shuffle', assignTeamRandomely);


router.get('/groups/:id', getGroupById);


router.post('/groups', validateCreateGroup, validateSchema, createGroup);


router.put('/groups/:id', validateCreateGroup, validateSchema, updateGroup);


router.delete('/groups/:id', deleteGroup);



export default router;