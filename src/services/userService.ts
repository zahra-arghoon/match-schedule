import prisma from '../prisma';

interface User {
    name: string;
    email: string;
  }
  
  const users: User[] = [];
  
  export const getUsersFromDB = async (): Promise<User[]> => {
    // Simulate database retrieval
    // const users = await prisma.user.findMany();
    // res.json(users);
    return users;
    return users;
  };
  
  export const saveUserToDB = async (user: User): Promise<User> => {
    // Simulate saving to a database
    users.push(user);
    return user;
  };