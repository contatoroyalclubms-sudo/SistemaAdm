import { IReservationRepository } from '@/domain/repositories/IReservationRepository';
import { Reservation, ReservationStatus } from '@/domain/entities/Reservation';
import { prisma } from '@/infrastructure/database/prisma';
import { logger } from '@/shared/logger';

export class PrismaReservationRepository implements IReservationRepository {
  async create(reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    try {
      const reservation = await prisma.reservation.create({
        data: {
          quantity: reservationData.quantity,
          totalAmount: reservationData.totalAmount,
          status: reservationData.status,
          notes: reservationData.notes,
          paymentMethod: reservationData.paymentMethod,
          paymentId: reservationData.paymentId,
          expiresAt: reservationData.expiresAt,
          confirmedAt: reservationData.confirmedAt,
          leadId: reservationData.leadId,
          productId: reservationData.productId,
          eventId: reservationData.eventId
        }
      });

      return this.mapToEntity(reservation);
    } catch (error) {
      logger.error('Error creating reservation', { error, reservationData });
      throw error;
    }
  }

  async findById(id: string): Promise<Reservation | null> {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id }
      });

      return reservation ? this.mapToEntity(reservation) : null;
    } catch (error) {
      logger.error('Error finding reservation by id', { error, id });
      throw error;
    }
  }

  async findByLeadId(leadId: string): Promise<Reservation[]> {
    try {
      const reservations = await prisma.reservation.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' }
      });

      return reservations.map(reservation => this.mapToEntity(reservation));
    } catch (error) {
      logger.error('Error finding reservations by lead id', { error, leadId });
      throw error;
    }
  }

  async findByEventId(eventId: string): Promise<Reservation[]> {
    try {
      const reservations = await prisma.reservation.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' }
      });

      return reservations.map(reservation => this.mapToEntity(reservation));
    } catch (error) {
      logger.error('Error finding reservations by event id', { error, eventId });
      throw error;
    }
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    try {
      const reservations = await prisma.reservation.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' }
      });

      return reservations.map(reservation => this.mapToEntity(reservation));
    } catch (error) {
      logger.error('Error finding reservations by status', { error, status });
      throw error;
    }
  }

  async findExpired(): Promise<Reservation[]> {
    try {
      const now = new Date();
      const reservations = await prisma.reservation.findMany({
        where: {
          expiresAt: {
            lt: now
          },
          status: {
            in: [ReservationStatus.PENDING, ReservationStatus.PAYMENT_PENDING]
          }
        },
        orderBy: { expiresAt: 'asc' }
      });

      return reservations.map(reservation => this.mapToEntity(reservation));
    } catch (error) {
      logger.error('Error finding expired reservations', { error });
      throw error;
    }
  }

  async findPendingPayment(): Promise<Reservation[]> {
    try {
      const reservations = await prisma.reservation.findMany({
        where: {
          status: ReservationStatus.PAYMENT_PENDING
        },
        orderBy: { createdAt: 'asc' }
      });

      return reservations.map(reservation => this.mapToEntity(reservation));
    } catch (error) {
      logger.error('Error finding pending payment reservations', { error });
      throw error;
    }
  }

  async update(id: string, data: Partial<Reservation>): Promise<Reservation> {
    try {
      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          status: data.status,
          notes: data.notes,
          paymentMethod: data.paymentMethod,
          paymentId: data.paymentId,
          expiresAt: data.expiresAt,
          confirmedAt: data.confirmedAt
        }
      });

      return this.mapToEntity(reservation);
    } catch (error) {
      logger.error('Error updating reservation', { error, id, data });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.reservation.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      logger.error('Error deleting reservation', { error, id });
      return false;
    }
  }

  async confirmPayment(id: string, paymentId: string, paymentMethod: string): Promise<Reservation> {
    try {
      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CONFIRMED,
          paymentId,
          paymentMethod,
          confirmedAt: new Date()
        }
      });

      return this.mapToEntity(reservation);
    } catch (error) {
      logger.error('Error confirming payment', { error, id, paymentId });
      throw error;
    }
  }

  async markAsExpired(id: string): Promise<Reservation> {
    try {
      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.EXPIRED
        }
      });

      return this.mapToEntity(reservation);
    } catch (error) {
      logger.error('Error marking reservation as expired', { error, id });
      throw error;
    }
  }

  async getReservationStats(eventId?: string): Promise<{
    total: number;
    confirmed: number;
    pending: number;
    expired: number;
    revenue: number;
  }> {
    try {
      const whereClause = eventId ? { eventId } : {};

      const [total, confirmed, pending, expired, revenue] = await Promise.all([
        prisma.reservation.count({ where: whereClause }),
        prisma.reservation.count({
          where: { ...whereClause, status: ReservationStatus.CONFIRMED }
        }),
        prisma.reservation.count({
          where: {
            ...whereClause,
            status: {
              in: [ReservationStatus.PENDING, ReservationStatus.PAYMENT_PENDING]
            }
          }
        }),
        prisma.reservation.count({
          where: { ...whereClause, status: ReservationStatus.EXPIRED }
        }),
        prisma.reservation.aggregate({
          where: { ...whereClause, status: ReservationStatus.CONFIRMED },
          _sum: { totalAmount: true }
        })
      ]);

      return {
        total,
        confirmed,
        pending,
        expired,
        revenue: Number(revenue._sum.totalAmount || 0)
      };
    } catch (error) {
      logger.error('Error getting reservation stats', { error, eventId });
      throw error;
    }
  }

  async list(limit: number = 50, offset: number = 0): Promise<Reservation[]> {
    try {
      const reservations = await prisma.reservation.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return reservations.map(reservation => this.mapToEntity(reservation));
    } catch (error) {
      logger.error('Error listing reservations', { error, limit, offset });
      throw error;
    }
  }

  private mapToEntity(data: any): Reservation {
    return {
      id: data.id,
      quantity: data.quantity,
      totalAmount: Number(data.totalAmount),
      status: data.status,
      notes: data.notes,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      expiresAt: data.expiresAt,
      confirmedAt: data.confirmedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      leadId: data.leadId,
      productId: data.productId,
      eventId: data.eventId
    };
  }
}
