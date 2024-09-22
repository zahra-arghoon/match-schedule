import { check, validationResult } from 'express-validator';
import { getEventById } from '../services/eventService';
import dayjs from 'dayjs';

// Validation rules for the event creation
export const validateCreateEvent = [
    check('name').isString().withMessage('Event name must be a string'),

    // Validate that startDate is in YYYY-MM-DD format
    check('startDate')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Start date must be in YYYY-MM-DD format'),

    // Validate that endDate is in YYYY-MM-DD format
    check('endDate')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('End date must be in YYYY-MM-DD format'),

    check('pitches').optional().isInt({ min: 1 }).withMessage('Pitches must be an integer greater than 0'),

    check('timeId').isInt({ min: 1 }).withMessage('Time ID must be an integer greater than 0')
];
export const validateUpdateEvent = [
    check('id')
        .notEmpty()
        .withMessage('eventId is required')
        .bail()
        .isInt()
        .withMessage('eventId has to be a number')
        .bail()
        .custom(async (value) => {
            const event = await getEventById(Number(value));

            if (!event) {
                throw new Error('Event not found'); // If the event doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid eventId'),
    check('startDate')
        .matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
        .withMessage('Start date must be in YYYY-MM-DD HH:mm format'),

    // Validate that endDate is in YYYY-MM-DD HH:mm format
    check('endDate')
        .matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
        .withMessage('End date must be in YYYY-MM-DD HH:mm format')
        .bail()
        .custom((value, { req }) => {
            const startDate = dayjs(req.body.startDate, 'YYYY-MM-DD HH:mm');
            const endDate = dayjs(value, 'YYYY-MM-DD HH:mm');

            // Check if the endDate is after the startDate and there is more than 0 hour difference
            if (!endDate.isAfter(startDate)) {
                throw new Error('End date must be after the start date');
            }

            // Ensure that there is more than zero hours difference
            const diffInHours = endDate.diff(startDate, 'hour');
            if (diffInHours <= 0) {
                throw new Error('There must be at least one hour difference between start and end date');
            }

            return true;
        }),

    check('pitchNumber').optional().isInt({ min: 1 }).withMessage('Pitches must be an integer greater than 0')
];
export const validateEventId = [
    check('id')
        .notEmpty()
        .withMessage('eventId is required')
        .bail()
        .isInt()
        .withMessage('eventId has to be a number')
        .bail()
        .custom(async (value) => {
            const event = await getEventById(Number(value));

            if (!event) {
                throw new Error('Event not found'); // If the event doesn't exist, throw an error
            }
            return true;
        })
        .withMessage('Invalid eventId')
];
