import { check, validationResult } from 'express-validator';
import { getTimingById } from '../services/timingService';
// Validation rules for the event creation
export const validateCreateTiming = [
    check('gameTime').isInt().withMessage('Timing gameTime must be a number'),
    check('gapTime').isInt().withMessage('Timing gapTime must be a number'),
    check('halfTime').isInt().withMessage('Timing halfTime must be a number'),
    check('extendPitchTime').optional().isBoolean().withMessage('Timing extendPitchTime must be boolean'),
    check('addPitch').optional().isBoolean().withMessage('Timing extendPitchTime must be booleaan')
];
export const validateTimeId = [
    check('id')
        .notEmpty()
        .withMessage('TimeId is mandatory')
        .bail()
        .isInt()
        .withMessage('TimeId must be a string')
        .bail()
        .custom(async (value) => {
            const timing = await getTimingById(Number(value));

            if (timing.status === 'error') {
                throw new Error(timing.message);
            }
            return true;
        })
        .withMessage('Invalid TimeId')
];
