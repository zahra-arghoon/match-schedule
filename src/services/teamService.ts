import prisma from '../prisma';
import { ITeam,IGroup,localRes } from '../interfaces/interface';
import {isGroupAvailableForTeam} from '../utils/isGroupPopulated'
import { log } from 'console';
  
  const teams: ITeam[] = [];
  export const getAssignedTeamCount = async (): Promise<number> => {
    try {
      const teams = await prisma.team.findMany({
        where: {
          isAvailable: false, 
        },
      });
      return teams.length;
    } catch (error) {
      console.error('Error fetching assigned team count:', error);
      return 0; 
    }
  };
  export const getAvailableTeamsFromDb = async (): Promise<ITeam[]> => {
    
    const teams = await prisma.team.findMany({
        where: {
          isAvailable: true,  // Fetch only available teams
          groupId: null       // Optionally, ensure the team is not assigned to any group
        }
      });
    
      return teams;
  };
  export const getAllTeamsFromDb = async (): Promise<ITeam[]> => {
    
    const teams = await prisma.team.findMany();
      return teams;
  };

// Create a new team
export const createTeamInDb = async (name: string, logo: string): Promise<ITeam> => {
    const newTeam = await prisma.team.create({
      data: {
        name,
        logo,
        isAvailable: true,  // Newly created teams are available by default
      }
    });
    return newTeam;
  };
  
  // Fetch a team by ID
  export const getTeamByIdFromDb = async (teamId: number): Promise<ITeam | null> => {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId
      }
    });
    
    return team;
  };
  
  // Update a team's details
  export const updateTeamInDb = async (teamId: number, name: string, logo: string): Promise<ITeam | null> => {
    const updatedTeam = await prisma.team.update({
      where: {
        id: teamId
      },
      data: {
        name,
        logo,
      }
    });
    return updatedTeam;
  };
  
  // Example function that adds a team to a group
  export const assignTeamToGroup = async (teamId: number, groupId: number): Promise<ITeam | localRes> => {
    try {
      // Fetch the team details
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });
      
      if (!team) {
        return { status: 'fail', message: 'Team not found' };
      }
  
      // Check if the team is already assigned to the group
      if (team.groupId === groupId) {
        return { status: 'fail', message: 'Team is already assigned to this group' };
      }
  
      // Check if the new group is available
      const isGroupAvailable: boolean | string = await isGroupAvailableForTeam(groupId);
      if (typeof isGroupAvailable === 'string') {
        return { status: 'fail', message: isGroupAvailable }; // Group not found or other issue
      }
  
      if (!isGroupAvailable) {
        return { status: 'fail', message: 'The destination group is already full' };
      }
  
      // Assign the team to the new group and mark as unavailable
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          groupId: groupId,
          isAvailable: false,
        },
      });
  
      return updatedTeam;
    } catch (error) {
      console.error('Error in assignTeamToGroup:', error);
      return { status: 'fail', message: 'An error occurred while assigning the team to the group' };
    }
  };
  
export const removeTeamGroup = async(teamId: number): Promise<ITeam | localRes>   =>{
 

     // Move the team to the new group
     const updatedTeam = await prisma.team.update({
        where: { id: Number(teamId) },
        data: { groupId: null,isAvailable:true }, 
    });
      return updatedTeam    

  }
  
  
