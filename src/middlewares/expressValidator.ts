import { Request, Response, NextFunction, Router } from 'express';
const { validationResult } = require('express-validator')

export const validateSchema = (req:Request, res:Response, next:NextFunction) => {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

