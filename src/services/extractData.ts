type Match = {
    team1: number;
    team2: number;
    groupId: number;
};

type EventData = {
    id: number;
    eventId: number;
    team1Id: number;
    team2Id: number;
    groupId: number;
    pitchId: number;
    orderIndex: number;
    duration: number;
    scheduledTime: Date;
};


export function extractMatches(data: EventData[]): { matchesByGroup: Match[][]; matchCount: number } {
    // Create a map to group matches by groupId
    const groupedMatches: { [key: number]: Match[] } = {};
    let matchCount = 0; // Variable to keep track of match count

    data.forEach((match) => {
        const matchData: Match = {
            team1: match.team1Id,
            team2: match.team2Id,
            groupId: match.groupId
        };

        // If the groupId does not exist in the map, create it
        if (!groupedMatches[match.groupId]) {
            groupedMatches[match.groupId] = [];
        }

        // Add the match to the appropriate group
        groupedMatches[match.groupId].push(matchData);
        matchCount++; // Increment match count
    });
  return {
      matchesByGroup: Object.values(groupedMatches),
      matchCount
  };
    // Return the grouped matches as an array of arrays
}

