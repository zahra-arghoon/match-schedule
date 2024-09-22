import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const isGroupAvailableForTeam = async (groupId: number): Promise<boolean | string> => {
  // Fetch the group along with its teams
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { teams: true }, // Include teams in the group
  });
  // Return a message if the group is not found
  if (!group) {
    return 'Group not found';
  }

  // Check if the number of teams is less than the maxTeam limit
  return group.teams.length < group.maxTeam;
};

