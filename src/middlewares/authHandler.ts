import { Request, Response, NextFunction, Router } from 'express';
import { verifyToken } from '../services/authService';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ message: 'Invalid token' });
      }
      
        (req as any).user = decoded;
        return next();
      
    }
    return res.status(403).json({ message: 'Forbidden' });
  };



// Middleware to restrict access to super admins only
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ message: 'Invalid token' });
    }
  
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access Denied: Requires Super Admin Privileges' });
    }
    
      (req as any).user = decoded;
      return next();
    
  }
  return res.status(403).json({ message: 'Forbidden' });

};
