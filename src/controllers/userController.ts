import { Request, Response } from 'express';
import { getUsersFromDB, saveUserToDB } from '../services/userService';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  /*
      #swagger.tags = ['User']
      #swagger.parameters['obj'] = {
              in: 'body',
              description: "Models User",
              schema: { $ref: '#/definitions/User' }
          }
     */
  try {
    const users = await getUsersFromDB();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve users', error });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  /*
      #swagger.tags = ['User']
      #swagger.parameters['obj'] = {
              in: 'body',
              description: "Models User",
              schema: { $ref: '#/definitions/User' }
          }
     */
  try {
    const { name, email } = req.body;
    const newUser = await saveUserToDB({ name, email });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user', error });
  }
};