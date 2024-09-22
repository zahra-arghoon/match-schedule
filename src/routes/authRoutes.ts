import { Request, Response, NextFunction, Router } from 'express';

const router = Router();
import {isAuthenticated,isSuperAdmin} from '../middlewares/authHandler'
import {loginAdmin} from '../controllers/authController'
import {validateSchema} from '../middlewares/expressValidator'
import {createUserValidation} from '../dto/validateUser'
// Login Route
/**
 * @route POST /api/login
 * @group Authentication - Operations related to login
 * @param {LoginRequest.model} request.body.required - Login details
 * @returns {LoginResponse.model} 200 - Successful login
 * @returns {Error} 401 - Unauthorized
 */
router.post('/login', createUserValidation, validateSchema, loginAdmin);

// Super Admin Dashboard route
/**
 * @route GET /api/superadmin/dashboard
 * @group SuperAdmin - Operations for super admin
 * @returns {Success} 200 - Welcome message
 * @returns {Error} 403 - Forbidden
 */
router.get('/superadmin/dashboard', isSuperAdmin, (req, res) => {
   /*
      #swagger.tags = ['SuperAdmin']
     */
  res.json({ message: 'Welcome to the super admin dashboard!' });
});

// Protected Route
/**
 * @route GET /api/protected
 * @group Protected - Operations for authenticated users
 * @returns {Success} 200 - Access granted message
 * @returns {Error} 401 - Unauthorized
 */
router.get('/protected', isAuthenticated, (req, res) => {
   /*
      #swagger.tags = ['Admin']
     */
  res.json({ message: `Hello, ${(req as any).user.username}! You have access to this route.` });
});

export default router;
