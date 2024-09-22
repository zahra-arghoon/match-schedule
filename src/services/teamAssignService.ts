import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Utility function to shuffle an array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const randomlyAssignTeamsToGroups = async (): Promise<string> => {

    await prisma.team.updateMany({
        data: { groupId: null },
        });
  // Fetch all unassigned teams and groups
  const teams = await prisma.team.findMany({ where: { groupId: null } });
  const groups = await prisma.group.findMany();

  if (!teams.length || !groups.length) {
    return 'No teams or groups available for assignment';
  }

  // Shuffle the teams randomly
  const shuffledTeams = shuffleArray(teams);

  // Step 1: Calculate how many teams can be evenly distributed among groups
  const teamsPerGroup = Math.floor(shuffledTeams.length / groups.length);
  const remainingTeams = shuffledTeams.length % groups.length; // Remaining teams after even distribution

  // Step 2: Assign teams equally to all groups
  let teamIndex = 0;
  for (const group of groups) {
    const groupTeams = shuffledTeams.slice(teamIndex, teamIndex + teamsPerGroup);

    for (const team of groupTeams) {
      await prisma.team.update({
        where: { id: team.id },
        data: { groupId: group.id, isAvailable: false },
      });
    }

    teamIndex += teamsPerGroup; // Move to the next set of teams
  }

  // Step 3: Assign the remaining teams in a round-robin fashion
  for (let i = 0; i < remainingTeams; i++) {
    const group = groups[i % groups.length]; // Cycle through the groups in round-robin

    await prisma.team.update({
      where: { id: shuffledTeams[teamIndex].id },
      data: { groupId: group.id, isAvailable: false },
    });

    teamIndex++;
  }

  return 'Teams assigned equally to groups with round-robin for remaining teams';
};
