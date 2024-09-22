import { check, validationResult } from 'express-validator';
import { getGroupByIdFromDb } from '../services/groupService';

// Validation rules for the event creation
export const validateCreateGroup = [
    check('name').optional().isString().withMessage('Team name must be a string'),
    check('id')
        .notEmpty()
        .withMessage('groupId is mandatory')
        .bail()
        .isInt()
        .withMessage('groupId must be a number')
        .bail()
        .custom(async (value) => {
            const event = await getGroupByIdFromDb(Number(value));

            if (!event) {
                throw new Error('Event not found'); // If the event doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid groupId'),
];
