import { Router } from 'express';
import { getAllUsers, createUser } from '../controllers/userController';

const router: Router = Router();

// Route to get all users
router.get('/users', getAllUsers);

// Route to create a new user
router.post('/users', createUser);

export default router;