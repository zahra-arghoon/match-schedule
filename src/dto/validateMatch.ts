import { check, validationResult } from 'express-validator';
import { getMatchById } from '../services/matchService';
import { getPitchById } from '../services/pitchService';
import dayjs from 'dayjs';



export const validateMatch = [
    check('newOrderIndex')
        .notEmpty()
        .withMessage('newOrderIndex is required')
        .isInt({ min: 1 })
        .withMessage('newOrderIndex must be an integer greater than 0'),
    check('matchId')
        .notEmpty()
        .withMessage('MatchId is required')
        .bail()
        .isInt()
        .withMessage('matchId has to be a number')
        .bail()
        .custom(async (value) => {
            const match = await getMatchById(Number(value));

            if (!match) {
                throw new Error('match not found'); // If the match doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid MatchId'),
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
        .withMessage('Invalid pitchId')
];
