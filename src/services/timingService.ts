import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new timing configuration
export const createTiming = async (data: { gameTime: number; halfTime: number; gapTime: number }) => {
  try {
    return await prisma.timing.create({
      data,
    });
  } catch (error) {
    console.error('Error creating timing configuration:', error);
    return {status:"error",message:"Failed to create timing configuration"}
  }
};

// Get all timing configurations
export const getAllTimings = async () => {
  try {
    return await prisma.timing.findMany();
  } catch (error) {
    console.error('Error fetching all timings:', error);
    throw new Error('Failed to fetch timings');
  }
};

// Get a single timing by ID
export const getTimingById = async (id: number) => {
    try {
      const timing = await prisma.timing.findUnique({
        where: { id },
      });
  
      if (!timing) {
        return { status: "error", message: `Timing configuration with ID ${id} not found` };
      }
  
      // Return the success response with the timing data
      return { status: "success", data: timing };
    } catch (error) {
      console.error(`Error fetching timing with ID ${id}:`, error);
      return { status: "error", message: "Failed to fetch timing configuration" };
    }
  };
  

// Update a timing configuration by ID
export const updateTiming = async (id: number, data: { gameTime?: number; halfTime?: number; gapTime?: number }) => {
  try {
    const updatedTiming = await prisma.timing.update({
      where: { id },
      data,
    });
    return updatedTiming;
  } catch (error) {
    console.error(`Error updating timing configuration with ID ${id}:`, error);
    throw new Error('Failed to update timing configuration');
  }
};
