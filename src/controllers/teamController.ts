import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    getAvailableTeamsFromDb,
    assignTeamToGroup,
    removeTeamGroup,
    getAllTeamsFromDb,
    createTeamInDb,
    getTeamByIdFromDb,
    updateTeamInDb} from '../services/teamService';
const prisma = new PrismaClient();

// Get all teams
export const getAllTeams = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Team']
     */
    try {
        const teams = await getAllTeamsFromDb();
        res.json({message:"here are all the teams",data:teams});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve teams' });
    }
};
export const getAvailableTeams = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Team']
     */
    try {
        let message: string = 'here are the teams';
        const teams = await getAvailableTeamsFromDb();
        if (teams.length === 0) {
            message = 'there are no avaialbe teams';
        }
        res.json({ message, teams });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve teams' });
    }
};
export const addTeam = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Team']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Team",
                 schema: { $ref: '#/definitions/TeamUpdate' }
             }
     */
    try {
        const { teamId, groupId } = req.body;
        const response = await assignTeamToGroup(teamId, groupId);
        // if(response.status !== "fail"){}

        res.json(response );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve teams' });
    }
};
export const changeTeam = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Team']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Team",
                 schema: { $ref: '#/definitions/TeamUpdate' }
             }
     */
    try {
        const { teamId, groupId } = req.body;
        const response = await assignTeamToGroup(teamId, groupId);

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve teams' });
    }
};
export const removeTeam = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Team']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Team",
                 schema: { $ref: '#/definitions/TeamRemove' }
             }
     */
    try {
        const { teamId } = req.body;
        const response = await removeTeamGroup(teamId);
        console.log(response);

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve teams' });
    }
};

// Controller to create a new team
export const createTeam = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['SuperAdmin']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Team",
                 schema: { $ref: '#/definitions/TeamCreate' }
             }
     */
    const { name, logo } = req.body;

    try {
        const newTeam = await createTeamInDb(name, logo);
        res.status(201).json(newTeam);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create team' });
    }
};

export const getTeamById = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Team']
     */
    const { id } = req.params;

    try {
        const team = await getTeamByIdFromDb(Number(id));
        if (team) {
            res.json({message:"here is the team",data:team});
        } else {
            res.status(404).json({ error: 'Team not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
};

// Controller to update a team
export const updateTeam = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Team']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Team",
                 schema: { $ref: '#/definitions/TeamCreate' }
             }
     */
    const { id } = req.params;
    const { name, logo } = req.body;

    try {
        const updatedTeam = await updateTeamInDb(Number(id), name, logo);
        if (updatedTeam) {
            res.json({message:"here is the updated team",data:updatedTeam});
        } else {
            res.status(404).json({ error: 'Team not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update team' });
    }
};

