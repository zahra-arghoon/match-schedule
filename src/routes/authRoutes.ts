import { Request, Response, NextFunction, Router } from 'express';

const router = Router();
import {isAuthenticated,isSuperAdmin} from '../middlewares/authHandler'
import {loginAdmin} from '../controllers/authController'
import {validateSchema} from '../middlewares/expressValidator'
import {createUserValidation} from '../dto/validateUser'
// Login Route

router.post('/login', createUserValidation, validateSchema, loginAdmin);

router.get('/superadmin/dashboard', isSuperAdmin, (req, res) => {
   /*
      #swagger.tags = ['SuperAdmin']
     */
  res.json({ message: 'Welcome to the super admin dashboard!' });
});

router.get('/protected', isAuthenticated, (req, res) => {
   /*
      #swagger.tags = ['Admin']
     */
  res.json({ message: `Hello, ${(req as any).user.username}! You have access to this route.` });
});

export default router;
