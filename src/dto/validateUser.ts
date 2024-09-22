// src/middleware/userValidation.ts
import { body } from 'express-validator';

export const createUserValidation = [
  body('username').isString().withMessage('Name must be a string'),
  body('password')
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters long')
];
