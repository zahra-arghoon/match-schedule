import { check, validationResult } from 'express-validator';
import { getPitchById } from '../services/pitchService';
// import { getPitchById } from '../services/pitchService';

export const validateGapAdd = [
    check('orderIndex')
        .notEmpty()
        .withMessage('orderIndex is required')
        .isInt({ min: 1 })
        .withMessage('orderIndex must be an integer greater than 0'),
    check('gapTime')
        .notEmpty()
        .withMessage('gapTime is required')
        .isInt()
        .withMessage('gapTime must be an integer'),
    check('extendPitchTime')
        .notEmpty()
        .withMessage('extendPitchTime is required')
        .isBoolean()
        .withMessage('extendPitchTime must be a boolean'),
    check('pitchIndex')
        .notEmpty()
        .withMessage('pitchIndex is required')
        .bail()
        .isInt()
        .withMessage('pitchIndex has to be a number')
        .bail()
        .custom(async (value) => {
            const pitch = await getPitchById(Number(value));

            if (!pitch) {
                throw new Error('pitch not found'); // If the pitch doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid pitchIndex'),

];
export const validateDeleteGap = [
    check('orderIndex')
        .notEmpty()
        .withMessage('orderIndex is required')
        .isInt({ min: 1 })
        .withMessage('orderIndex must be an integer greater than 0'),
    check('pitchIndex')
        .notEmpty()
        .withMessage('pitchIndex is required')
        .bail()
        .isInt()
        .withMessage('pitchIndex has to be a number')
        .bail()
        .custom(async (value) => {
            const Gap = await getPitchById(Number(value));

            if (!Gap) {
                throw new Error('pitch not found'); // If the Gap doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid pitchIndex'),
];

export const validateGapMove = [
    check('newOrderIndex')
        .notEmpty()
        .withMessage('newOrderIndex is required')
        .isInt({ min: 1 })
        .withMessage('newOrderIndex must be an integer greater than 0'),
    check('oldOrderIndex')
        .notEmpty()
        .withMessage('oldOrderIndex is required')
        .isInt({ min: 1 })
        .withMessage('oldOrderIndex must be an integer greater than 0'),
    check('pitchIndex')
        .notEmpty()
        .withMessage('pitchIndex is required')
        .bail()
        .isInt()
        .withMessage('pitchIndex has to be a number')
        .bail()
        .custom(async (value) => {
            const pitch = await getPitchById(Number(value));

            if (!pitch) {
                throw new Error('pitch not found'); // If the pitch doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid pitchIndex'),
    check('newPitchIndex')
        .notEmpty()
        .withMessage('newPitchIndex is required')
        .bail()
        .isInt()
        .withMessage('newPitchIndex has to be a number')
        .bail()
        .custom(async (value) => {
            const pitch = await getPitchById(Number(value));

            if (!pitch) {
                throw new Error('pitch not found'); // If the pitch doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid newPitchIndex')
];