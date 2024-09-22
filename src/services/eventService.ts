import { PrismaClient } from '@prisma/client';
import { ITiming,IEvent } from '../interfaces/interface';
const prisma = new PrismaClient();

// Create a new event
export const createEvent = async (data:IEvent) => {
    try {
      const event = await prisma.event.create({
        data,
      });
      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  };
  
// Get all events
export const getAllEvents = async () => {
try {
    const events = await prisma.event.findMany({include:{matches:{orderBy:{pitchId:'asc'}}}});
    return events;
} catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch events');
}
};
// delete all events
export const deleteAllEvents = async () => {
  try {
    await prisma.event.deleteMany({});
  } catch (error) {
      console.error('Error deleting events:', error);
      throw new Error('Failed to delete events');
  }
};

// Get a single event by ID
export const getEventById = async (id: number) => {
try {
    const event = await prisma.event.findUnique({
    where: { id },include:{matches:true}
    });
    if (!event) {
    throw new Error(`Event with ID ${id} not found`);
    }
    return event;
} catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    throw new Error(`Failed to fetch event with ID ${id}`);
}
};

// Update an event by ID
export const updateEvent = async (id: number, data: { name?: string; startDate?: Date; endDate?: Date; pitchNumber?: number; timeId?: number }) => {
try {
    const event = await prisma.event.update({
    where: { id },
    data,
    });
    return event;
} catch (error) {
    console.error(`Error updating event with ID ${id}:`, error);
    throw new Error(`Failed to update event with ID ${id}`);
}
};

// Update an event by ID
export const updateEventTiming = async (id: number, data: ITiming) => {
    
    const timing = await prisma.timing.create({
        data,
      })
  return await prisma.event.update({
    where: { id },
    data:{ timeId:timing.id},
  });
};

