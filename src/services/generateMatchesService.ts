import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// Helper function to generate round-robin matches
const generateRoundRobinMatches = (teams: number[]): { team1: number; team2: number }[] => {
    const matches: { team1: number; team2: number }[] = [];

    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matches.push({
                team1: teams[i],
                team2: teams[j]
            });
        }
    }
    return matches;
};

// Service to get groups with teams and generate matches
export const generateMatches = async (
    eventId: number
): Promise<{ data: { team1: number; team2: number; groupId: number }[][]; totalMatchCount: number }> => {
    try {
        const data: { team1: number; team2: number; groupId: number }[][] = []; // Store the generated matches
        const groups = await prisma.group.findMany({
            include: {
                teams: true // Fetch teams within each group
            }
        });

        let totalMatchCount = 0;

        // Loop through each group and generate round-robin matches
        for (const group of groups) {
            const teamIds = group.teams.map((team) => team.id); // Get team IDs

            if (teamIds.length < 2) {
                console.log(`Skipping group ${group.name}: Not enough teams for matches.`);
                continue;
            }

            // Generate round-robin matches for the group
            const matches = generateRoundRobinMatches(teamIds);
            const matchesWithGroupId = matches.map((match) => ({ ...match, groupId: group.id })); // Include groupId in each match
            totalMatchCount += matches.length;

            data.push(matchesWithGroupId); // Push matches for the group as an inner array

            console.log(`Generated ${matches.length} matches for group ${group.name}`);
        }

        console.log(`Total matches generated: ${totalMatchCount}`);

        return { data, totalMatchCount }; // Return the array of created matches
    } catch (error) {
        console.error('Error generating group matches:', error);
        return { totalMatchCount: 0, data: [] }; // Return 0 matches in case of an error
    }
};
