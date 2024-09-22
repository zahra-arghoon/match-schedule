import prisma from '../prisma';
import { ITeam,IGroup } from '../interfaces/interface';

  // Fetch all groups
export const getAllGroupsFromDb = async (): Promise<IGroup[]> => {
    const groups = await prisma.group.findMany({
      include: {
        teams: true  // Optionally include teams in the group
      }
    });
    return groups;
  };
  
  // Fetch a group by ID
  export const getGroupByIdFromDb = async (groupId: number): Promise<IGroup | null> => {
    const group = await prisma.group.findUnique({
      where: {
        id: groupId
      },
      include: {
        teams: true  // Optionally include teams in the group
      }
    });
    return group;
  };
  
  // Create a new group
  export const createGroupInDb = async (name: string): Promise<IGroup> => {
    const newGroup = await prisma.group.create({
      data: {
        name,
        maxTeam: 4,
        minTeam: 2
      }
    });
    return newGroup;
  };
  
  // Update a group's details
  export const updateGroupInDb = async (groupId: number, name: string): Promise<IGroup | null> => {
    const updatedGroup = await prisma.group.update({
      where: {
        id: groupId
      },
      data: {
        name,
      }
    });
    return updatedGroup;
  };
  
  // Delete a group
  export const deleteGroupFromDb = async (groupId: number): Promise<void> => {
    await prisma.group.delete({
      where: {
        id: groupId
      }
    });
  };
  