import { check, validationResult } from 'express-validator';
import { getTeamByIdFromDb } from '../services/teamService';
// Validation rules for the event creation
export const validateCreateTeam = [
    check('id')
        .notEmpty()
        .withMessage('teamId is mandatory')
        .bail()
        .isInt()
        .withMessage('teamId must be a string')
        .bail()
        .custom(async (value) => {
            const event = await getTeamByIdFromDb(Number(value));

            if (!event) {
                throw new Error('Event not found'); // If the event doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid teamId'),
    check('name').optional().isString().withMessage('Team name must be a string'),
    check('logo').optional().isString().withMessage('Team logo must be a string')
];
export const validateTeam = [
    check('teamId')
        .notEmpty()
        .withMessage('teamId is mandatory')
        .bail()
        .custom(async (value) => {
            const team = await getTeamByIdFromDb(Number(value));

            if (!team) {
                throw new Error('team not found'); // If the team doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid teamId')
        .bail()
        .isInt()
        .withMessage('teamId must be a string'),
    check('groupId').notEmpty().withMessage(' groupId is mandatory').bail().isInt().withMessage('groupId must be a string')
];
export const validateTeamId = [
    check('teamId')
        .notEmpty()
        .withMessage('teamId is mandatory')
        .bail()
        .isInt()
        .withMessage('teamId must be a number')
        .bail()
        .custom(async (value) => {
            const team = await getTeamByIdFromDb(Number(value));

            if (!team) {
                throw new Error('team not found');
            }
            return true;
        })
        .withMessage('Invalid teamId')
];
