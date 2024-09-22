import { Request, Response } from 'express';
import {
  getAllGroupsFromDb,
  createGroupInDb,
  getGroupByIdFromDb,
  updateGroupInDb,
  deleteGroupFromDb
} from '../services/groupService';

import {    randomlyAssignTeamsToGroups,
} from '../services/teamAssignService'


// Controller to fetch all groups
export const getAllGroups = async (req: Request, res: Response) => {
   /*
         #swagger.tags = ['Group']
   */
  try {
    const groups = await getAllGroupsFromDb();
    res.json({message:"here are the groups",data:groups});
} catch (error) {
  console.log(error);
  res.status(500).json({ error: 'Failed to fetch groups' });
}
};

export const assignTeamRandomely = async (req:Request,res:Response)=>{
    /*
         #swagger.tags = ['Group']
     */
    try {
        const result = await randomlyAssignTeamsToGroups()
        res.json(result);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to fetch groups' });
        
    }
}

export const createGroup = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['SuperAdmin']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Group",
                 schema: { $ref: '#/definitions/Group' }
             }
     */
  const { name } = req.body;

  try {
    const newGroup = await createGroupInDb(name);
    res.status(201).json({message:"here is your group",data:newGroup});
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
};
export const getGroupById = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Group']
     */
  const { id } = req.params;

  try {
    const group = await getGroupByIdFromDb(Number(id));
    if (group) {
      res.json({message:"here is your group",data:group});
    } else {
      res.status(404).json({ error: 'Group not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
};

// Controller to update a group
export const updateGroup = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['Group']
         #swagger.parameters['obj'] = {
                 in: 'body',
                 description: "Models Group",
                 schema: { $ref: '#/definitions/Group' }
             }
     */
  const { id } = req.params;
  const { name } = req.body;

  try {
    const updatedGroup = await updateGroupInDb(Number(id), name);
    
    if (updatedGroup) {
      res.json({message:"here is your updated group",data:updatedGroup});
    } else {
      res.status(404).json({ error: 'Group not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' });
  }
};

// Controller to delete a group
export const deleteGroup = async (req: Request, res: Response) => {
    /*
         #swagger.tags = ['SuperAdmin']
     */
  const { id } = req.params;

  try {
    await deleteGroupFromDb(Number(id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
};
