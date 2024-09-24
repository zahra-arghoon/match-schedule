import { Request, Response, NextFunction, Router } from 'express';
import { authenticateUser, verifyToken } from '../services/authService';
const router = Router();



export const loginAdmin = (req: Request, res: Response) => {
    /*
      #swagger.tags = ['Login']
      #swagger.parameters['obj'] = {
              in: 'body',
              description: "Models Login",
              schema: { $ref: '#/definitions/SuperAdminLogin' }
          }
     */
    const { username, password } = req.body;

    // Authenticate the user and generate a token
    const token = authenticateUser(username, password);
    if (token) {
        return res.json({ token });
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
}