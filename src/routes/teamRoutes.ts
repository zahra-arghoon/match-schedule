import { Router } from 'express';
import {  getAvailableTeams ,addTeam,changeTeam,removeTeam,
    getAllTeams,getTeamById,
    createTeam,updateTeam
} from '../controllers/teamController';
import {isAuthenticated,isSuperAdmin} from '../middlewares/authHandler'
import { validateCreateTeam, validateTeam, validateTeamId } from '../dto/validateTeam';
import {validateSchema} from '../middlewares/expressValidator'

const router: Router = Router();


router.get('/teams/available', getAvailableTeams);

router.patch('/teams/add', validateTeam, validateSchema, addTeam);


router.patch('/teams/change', validateTeam, validateSchema, changeTeam);

router.patch('/teams/remove',validateTeamId,validateSchema, removeTeam);

router.post('/teams',isSuperAdmin, validateCreateTeam, validateSchema, createTeam);


router.get('/teams/all', getAllTeams);

router.put('/teams/:id', validateCreateTeam, validateSchema, updateTeam);


router.get('/teams/:id', getTeamById);




export default router;