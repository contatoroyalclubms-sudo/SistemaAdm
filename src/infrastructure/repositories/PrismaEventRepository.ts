import { IEventRepository } from '@/domain/repositories/IEventRepository';
import { Event, EventStatus, Lot } from '@/domain/entities/Event';
import { prisma } from '@/infrastructure/database/prisma';
import { logger } from '@/shared/logger';

export class PrismaEventRepository implements IEventRepository {
  async create(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    try {
      const event = await prisma.event.create({
        data: {
          name: eventData.name,
          date: eventData.date,
          openingTime: eventData.openingTime,
          headliner: eventData.headliner,
          description: eventData.description,
          venue: eventData.venue,
          status: eventData.status,
          lots: {
            create: eventData.lots.map(lot => ({
              name: lot.name,
              price: lot.price,
              validUntil: lot.validUntil,
              isActive: lot.isActive
            }))
          }
        },
        include: {
          lots: true
        }
      });

      return this.mapToEntity(event);
    } catch (error) {
      logger.error('Error creating event', { error, eventData });
      throw error;
    }
  }

  async findById(id: string): Promise<Event | null> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          lots: true
        }
      });

      return event ? this.mapToEntity(event) : null;
    } catch (error) {
      logger.error('Error finding event by id', { error, id });
      throw error;
    }
  }

  async findByStatus(status: EventStatus): Promise<Event[]> {
    try {
      const events = await prisma.event.findMany({
        where: { status },
        include: {
          lots: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      return events.map(event => this.mapToEntity(event));
    } catch (error) {
      logger.error('Error finding events by status', { error, status });
      throw error;
    }
  }

  async findUpcoming(): Promise<Event[]> {
    try {
      const events = await prisma.event.findMany({
        where: {
          date: {
            gt: new Date()
          },
          status: EventStatus.ACTIVE
        },
        include: {
          lots: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      return events.map(event => this.mapToEntity(event));
    } catch (error) {
      logger.error('Error finding upcoming events', { error });
      throw error;
    }
  }

  async findActive(): Promise<Event[]> {
    try {
      const events = await prisma.event.findMany({
        where: {
          status: EventStatus.ACTIVE
        },
        include: {
          lots: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      return events.map(event => this.mapToEntity(event));
    } catch (error) {
      logger.error('Error finding active events', { error });
      throw error;
    }
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    try {
      const event = await prisma.event.update({
        where: { id },
        data: {
          name: data.name,
          date: data.date,
          openingTime: data.openingTime,
          headliner: data.headliner,
          description: data.description,
          venue: data.venue,
          status: data.status
        },
        include: {
          lots: true
        }
      });

      return this.mapToEntity(event);
    } catch (error) {
      logger.error('Error updating event', { error, id, data });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.event.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      logger.error('Error deleting event', { error, id });
      return false;
    }
  }

  async list(limit: number = 50, offset: number = 0): Promise<Event[]> {
    try {
      const events = await prisma.event.findMany({
        include: {
          lots: true
        },
        orderBy: {
          date: 'desc'
        },
        take: limit,
        skip: offset
      });

      return events.map(event => this.mapToEntity(event));
    } catch (error) {
      logger.error('Error listing events', { error, limit, offset });
      throw error;
    }
  }

  private mapToEntity(data: any): Event {
    return {
      id: data.id,
      name: data.name,
      date: data.date,
      openingTime: data.openingTime,
      headliner: data.headliner,
      description: data.description,
      venue: data.venue,
      status: data.status,
      lots: data.lots?.map((lot: any): Lot => ({
        id: lot.id,
        name: lot.name,
        price: Number(lot.price),
        validUntil: lot.validUntil,
        isActive: lot.isActive
      })) || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }
}
