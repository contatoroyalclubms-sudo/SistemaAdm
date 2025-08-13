import { Event, EventStatus } from '@/domain/entities/Event';

export interface IEventRepository {
  create(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findByStatus(status: EventStatus): Promise<Event[]>;
  findUpcoming(): Promise<Event[]>;
  findActive(): Promise<Event[]>;
  update(id: string, data: Partial<Event>): Promise<Event>;
  delete(id: string): Promise<boolean>;
  list(limit?: number, offset?: number): Promise<Event[]>;
}
