import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check and seed Groups
  const existingGroups = await prisma.group.findMany();
  if (existingGroups.length === 0) {
    const groups = [
      { name: 'Group A', maxTeam: 4, minTeam: 2 },
      { name: 'Group B', maxTeam: 4, minTeam: 2 },
      { name: 'Group C', maxTeam: 4, minTeam: 2 },
      { name: 'Group D', maxTeam: 4, minTeam: 2 },
    ];

    for (const group of groups) {
      await prisma.group.create({
        data: group,
      });
    }
    console.log('Groups seeded successfully.');
  } else {
    console.log('Groups already exist, skipping group seeding.');
  }

  // Check and seed Teams
  const existingTeams = await prisma.team.findMany();
  if (existingTeams.length === 0) {

    const teams = [
      { name: 'Team 1', logo: 'alpha.png' },
      { name: 'Team 2', logo: 'alpha.png' },
      { name: 'Team 3', logo: 'alpha.png' },
      { name: 'Team 4', logo: 'alpha.png' },
      { name: 'Team 5', logo: 'alpha.png' },
      { name: 'Team 6', logo: 'alpha.png' },
      { name: 'Team 7', logo: 'alpha.png' },
      { name: 'Team 8', logo: 'alpha.png' },
      { name: 'Team 9', logo: 'alpha.png' },
      { name: 'Team 10', logo: 'alpha.png' },
      { name: 'Team 11', logo: 'alpha.png' },
      { name: 'Team 12', logo: 'alpha.png' },
      { name: 'Team 13', logo: 'alpha.png' },
      { name: 'Team 14', logo: 'alpha.png' },
      { name: 'Team 15', logo: 'alpha.png' },
      { name: 'Team 16', logo: 'alpha.png' },
    ];
    for (const team of teams) {
      await prisma.team.create({
        data: team,
      });
    }
    console.log('Teams seeded successfully.');
  } else {
    console.log('Teams already exist, skipping team seeding.');
  }
  // Check and seed timing
  const existingTimings = await prisma.timing.findMany();
  if (existingTimings.length === 0) {

    const timings = [
      {   gameTime: 90,         
        halfTime: 15,      
        gapTime: 15,  },
    ];
    for (const timing of timings) {
      await prisma.timing.create({
        data: timing,
      });
    }
    console.log('Teams seeded successfully.');
  } else {
    console.log('Teams already exist, skipping team seeding.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

