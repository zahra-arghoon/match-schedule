import { Request, Response } from 'express';
import { createEvent, getAllEvents, getEventById, updateEvent, updateEventTiming, deleteAllEvents } from '../services/eventService';
import dayjs from 'dayjs'; // Optional: Use a library like dayjs for handling date formats
import { getAllGroupsFromDb } from '../services/groupService';
import { getAssignedTeamCount } from '../services/teamService';
import { getMatchesByEventId } from '../services/matchService';
import { ITeam, IGroup } from '../interfaces/interface';
import { generateMatches } from '../services/generateMatchesService';
import { extractMatches } from '../services/extractData';
import { calculatePitchesNeeded } from '../utils/getPitchNumber';
import { createTiming, getAllTimings, getTimingById, updateTiming } from '../services/timingService';
import { convertToISOString } from '../utils/timeConverter';
import { validateCustomPitches, calculateMatchesPerPitch } from '../utils/validateCustomPitches';

import { newschedule } from '../services/scheduleService';
import { match } from 'assert';
import { log } from 'console';
export const getAllEventsController = async (req: Request, res: Response) => {
    /*
      #swagger.tags = ['Event']
     */
    try {
        const events = await getAllEvents();
        res.status(200).json({ message: 'here are all the events', events });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve events' });
    }
};

export const scheduleController = async (req: Request, res: Response) => {
    /*
       #swagger.tags = ['Event']
    */
    try {
        // Get the groups
        const groups = await getAllGroupsFromDb();
        const assignedTeamCount = await getAssignedTeamCount();

        // Validate if there are enough teams
        if (assignedTeamCount < groups.length * 2) {
            return res.status(422).json({ message: 'Assigned team count must be more' });
        }

        let messages: string[] = [];
        let maxTeamcount = 0;
        for (const group of groups) {
            const teamCount = group.teams ? group.teams.length : 0; // Handle undefined teams

            if (teamCount <= 2) {
                const message: string = `Group with name ${group.name} does not have the minimum number of teams`;
                messages.push(message);
            }
            if (teamCount >= maxTeamcount) {
                maxTeamcount = teamCount;
            }
        }

        if (messages.length !== 0) {
            return res.status(402).json({ message: messages });
        }

        // Create a default event
        try {
            const event = await createEvent({ timeId: 1 });
            const eventId: number = event.id;

            // Fetch event details, generate matches, and calculate game times
            // Generate matches for the event
            const ress = await generateMatches(eventId);
            const matchGroups = ress.data;
            const totalMatches = ress.totalMatchCount;

            // Fetch timing details
            const timingId = event.timeId ? event.timeId : 1;
            const result = await getTimingById(timingId);

            if (result.status === 'error') {
                throw new Error(result.message);
            }

            const timing = result.data;
            if (!timing) {
                throw new Error('Unexpected error: timing data is missing');
            }

            // Calculate the total game time
            const gameTime = timing.gameTime;
            const gapTime = timing.gapTime;
            const halfTime = timing.halfTime;
            const totalGameTime = gameTime + gapTime + halfTime;

            // Calculate the available time for the event
            const end = event.endDate.getTime();
            const start = event.startDate.getTime();
            const availableTime = (end - start) / 1000 / 60; // Available time in minutes
            const { pitchNumber, matchesPerPitch } = calculatePitchesNeeded(totalMatches, totalGameTime, availableTime);

            // Call the scheduling function with eventId and event details
            const resd = await newschedule(
                eventId,
                matchGroups,
                totalMatches,
                totalGameTime,
                availableTime,
                event.startDate,
                event.endDate,
                pitchNumber,
                maxTeamcount
            );
            if (resd.status === 'error') {
                return res.status(404).json({ maeesage: resd.message });
            }
            if (resd.status !== 'success') {
                return res.status(404).json({ error: 'not successful' });
            }

            return res.status(200).json({ message: 'Matches scheduled successfully', data: resd });
        } catch (error) {
            console.error('Error generating matches:', error);
            return res.status(500).json({ message: 'Match generation was unsuccessful' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error occurred' });
    }
};

export const updateEventTimingController = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Event']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Event",
                 schema: { $ref: '#/definitions/EventTiming' }
             }
     */
    try {
        const { id } = req.params;
        const eventId = Number(id);
        const { gameTime, halfTime, gapTime, extendPitchTime = false, addPitch = false } = req.body;

        // Fetch event details and matches
        const { startDate, endDate, pitchNumber } = await getEventById(eventId);
        const matches = await getMatchesByEventId(eventId);
        if (matches.length === 0) {
            return res.status(404).json({ status: 'error', message: 'no matches found to schedule! ' });
        }

        // Calculate available time in minutes
        const availableTime = (endDate.getTime() - startDate.getTime()) / 1000 / 60;

        // Calculate total game time
        const totalGameTime = gameTime + gapTime + halfTime;
        const nn: number | any = pitchNumber;
        // Validate custom pitch number and timing
        const { valid, message } = validateCustomPitches(nn, matches.length, totalGameTime, availableTime);
        const groups = await getAllGroupsFromDb();
        let maxTeamcount = 0;
        for (const group of groups) {
            const teamCount = group.teams ? group.teams.length : 0; // Handle undefined teams
            if (teamCount >= maxTeamcount) {
                maxTeamcount = teamCount;
            }
        }

        if (valid || addPitch) {
            // If valid, schedule matches with the provided pitch number
            const { pitchNumber } = calculatePitchesNeeded(matches.length, totalGameTime, availableTime);

            const { matchesByGroup, matchCount } = extractMatches(matches);
            const resd = await newschedule(
                eventId,
                matchesByGroup,
                matchCount,
                totalGameTime,
                availableTime,
                startDate,
                endDate,
                pitchNumber,
                maxTeamcount
            );
            if (resd.status === 'error') {
                return res.status(404).json({ maeesage: resd.message });
            }
            if (resd.status !== 'success') {
                return res.status(404).json({ error: 'not successful' });
            }
        } else if (extendPitchTime) {
            // If extending pitch time, adjust the event end date
            const { startDate, endDate, timeId } = await getEventById(eventId);
            const ii: number | any = timeId;
            const { data, status, message } = await getTimingById(ii);
            const timing = data;
            if (!timing) {
                return res.status(500).json({ message: 'Unexpected error: timing data is missing' });
            }
            const originalGameTime = timing.gameTime + timing.gapTime + timing.halfTime;
            const matchesPerPitch = Math.floor(availableTime / originalGameTime);

            const timeDifferenceInMillis = (totalGameTime - originalGameTime) * 60 * 1000 * matchesPerPitch; // Convert minutes to milliseconds
            const newEndDate = new Date(endDate.getTime() + timeDifferenceInMillis);

            await updateEvent(eventId, { endDate: newEndDate });
            const updatedEvent = await getEventById(eventId);
            const updatedAvailableTime = (updatedEvent.endDate.getTime() - updatedEvent.startDate.getTime()) / 1000 / 60;

            const { pitchNumber } = calculatePitchesNeeded(matches.length, totalGameTime, updatedAvailableTime);
            const minTeam = --maxTeamcount;
            if (pitchNumber < minTeam) {
                return res.status(402).json({ message: 'this event does not have valid number of pitches for your teams' });
            }
            const { matchesByGroup, matchCount } = extractMatches(matches);
            const resd = await newschedule(
                eventId,
                matchesByGroup,
                matchCount,
                totalGameTime,
                availableTime,
                updatedEvent.startDate,
                updatedEvent.endDate,
                pitchNumber,
                maxTeamcount
            );
            if (resd.status === 'error') {
                return res.status(404).json({ maeesage: resd.message });
            }
            if (resd.status !== 'success') {
                return res.status(404).json({ error: 'not successful' });
            }
        } else {
            // If neither valid nor adding pitch nor extending time, return error message
            return res.status(422).json({ message });
        }
        const updatedEvent = await updateEventTiming(eventId, { gameTime, halfTime, gapTime });
        if (!updatedEvent) return res.status(404).json({ error: 'Event not found' });
        res.status(200).json({ message: 'Event timing updated successfully or not' });
    } catch (error) {
        console.error('Failed to update event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};
export const customScheduleController = async (req: Request, res: Response) => {
    /*
      #swagger.tags = ['Event']
      #swagger.parameters['obj'] = {
              in: 'body',
              description: "Models Event",
              schema: { $ref: '#/definitions/EventUpdate' }
          }
     */
    try {
        const { id } = req.params;
        const eventId = Number(id);
        const { pitchNumber, startDate, endDate } = req.body;

        const event = await getEventById(eventId);
        if (event.matches.length === 0) {
            return res.status(404).json({ status: 'error', message: 'no matches found to schedule! ' });
        }

        const { data, status, message } = await getTimingById(event.timeId || 1);
        // const matches = await getMatchesByEventId(event.id);

        if (status === 'error') {
            return res.status(404).json({ status: 'error', message: message });
        }
        const timing = data;
        if (!timing) {
            return res.status(500).json({ status: 'error', message: 'Unexpected error: timing data is missing' });
        }
        const userStartDate = convertToISOString(startDate);
        const userEndDate = convertToISOString(endDate);

        // Use custom values if provided, otherwise fall back to default
        const eventStartDate = startDate ? new Date(userStartDate) : new Date(event.startDate);
        const eventEndDate = endDate ? new Date(userEndDate) : new Date(event.endDate);
        const availableTime = (eventEndDate.getTime() - eventStartDate.getTime()) / 1000 / 60;
        const totalGameTime = timing.gameTime + timing.gapTime + timing.halfTime;
        if (pitchNumber) {
            const { valid, message } = validateCustomPitches(pitchNumber, event.matches.length, totalGameTime, availableTime);

            if (!valid) {
                return res.status(400).json({ status: 'error', message: message });
            }
        }

        const finalPitchNumber = pitchNumber ? pitchNumber : calculatePitchesNeeded(event.matches.length, totalGameTime, availableTime).pitchNumber;
        console.log(finalPitchNumber, 'final pitch number');

        const groups = await getAllGroupsFromDb();
        let maxTeamcount = 0;
        for (const group of groups) {
            const teamCount = group.teams ? group.teams.length : 0; // Handle undefined teams
            if (teamCount >= maxTeamcount) {
                maxTeamcount = teamCount;
            }
        }
        const { matchesByGroup, matchCount } = extractMatches(event.matches);
        
        const resd = await newschedule(
            eventId,
            matchesByGroup,
            matchCount,
            totalGameTime,
            availableTime,
            eventStartDate,
            eventEndDate,
            finalPitchNumber,
            maxTeamcount
        );
        if (resd.status === 'error') {
            return res.status(404).json({ maeesage: resd.message });
        }
        return res.status(200).json({ status: 'Success', message: 'event schedule updated', data: resd });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error });
    }
};
export const getEventByIdController = async (req: Request, res: Response) => {
    /*
      #swagger.tags = ['Event']
     */
    try {
        const { id } = req.params;
        const event = await getEventById(Number(id));
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve event' });
    }
};
export const deleteAllEventsController = async (req: Request, res: Response) => {
    /*
      #swagger.tags = ['SuperAdmin']
     */
    try {
        // Delete all events
        await deleteAllEvents();
        // Send success response
        return res.status(200).json({ message: 'All matches have been deleted successfully.' });
    } catch (error) {
        // Handle any errors during deletion
        console.error('Error deleting all matches:', error);
        return res.status(500).json({ message: 'Failed to delete matches.' });
    }
};
