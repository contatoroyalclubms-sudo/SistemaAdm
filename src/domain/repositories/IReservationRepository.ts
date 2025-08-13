import { Reservation, ReservationStatus } from '@/domain/entities/Reservation';

export interface IReservationRepository {
  create(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  findByLeadId(leadId: string): Promise<Reservation[]>;
  findByEventId(eventId: string): Promise<Reservation[]>;
  findByStatus(status: ReservationStatus): Promise<Reservation[]>;
  findExpired(): Promise<Reservation[]>;
  findPendingPayment(): Promise<Reservation[]>;
  update(id: string, data: Partial<Reservation>): Promise<Reservation>;
  delete(id: string): Promise<boolean>;
  confirmPayment(id: string, paymentId: string, paymentMethod: string): Promise<Reservation>;
  markAsExpired(id: string): Promise<Reservation>;
  getReservationStats(eventId?: string): Promise<{
    total: number;
    confirmed: number;
    pending: number;
    expired: number;
    revenue: number;
  }>;
  list(limit?: number, offset?: number): Promise<Reservation[]>;
}
