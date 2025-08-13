export enum ReservationStatus {
  PENDING = 'PENDING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export interface Reservation {
  id: string;
  quantity: number;
  totalAmount: number;
  status: ReservationStatus;
  notes?: string;
  paymentMethod?: string;
  paymentId?: string;
  expiresAt?: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  leadId: string;
  productId: string;
  eventId: string;
}

export class ReservationEntity implements Reservation {
  constructor(
    public id: string,
    public quantity: number,
    public totalAmount: number,
    public status: ReservationStatus = ReservationStatus.PENDING,
    public notes: string | undefined = undefined,
    public paymentMethod: string | undefined = undefined,
    public paymentId: string | undefined = undefined,
    public expiresAt: Date | undefined = undefined,
    public confirmedAt: Date | undefined = undefined,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public leadId: string,
    public productId: string,
    public eventId: string
  ) {
    // Set default expiration to 30 minutes if not provided
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    }
  }

  isActive(): boolean {
    return [
      ReservationStatus.PENDING,
      ReservationStatus.PAYMENT_PENDING,
      ReservationStatus.CONFIRMED
    ].includes(this.status);
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt && this.status !== ReservationStatus.CONFIRMED;
  }

  canBeCancelled(): boolean {
    return [
      ReservationStatus.PENDING,
      ReservationStatus.PAYMENT_PENDING
    ].includes(this.status);
  }

  getFormattedTotalAmount(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.totalAmount);
  }

  getTimeUntilExpiration(): string | null {
    if (!this.expiresAt || this.status === ReservationStatus.CONFIRMED) {
      return null;
    }

    const now = new Date();
    const diffMs = this.expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expirado';
    }

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    
    return `${minutes}min`;
  }

  confirm(paymentMethod?: string, paymentId?: string): void {
    this.status = ReservationStatus.CONFIRMED;
    this.confirmedAt = new Date();
    this.updatedAt = new Date();
    
    if (paymentMethod) {
      this.paymentMethod = paymentMethod;
    }
    
    if (paymentId) {
      this.paymentId = paymentId;
    }
  }

  cancel(reason?: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Reserva não pode ser cancelada no status atual');
    }
    
    this.status = ReservationStatus.CANCELLED;
    this.updatedAt = new Date();
    
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nCancelamento: ${reason}` : `Cancelamento: ${reason}`;
    }
  }

  markAsExpired(): void {
    if (this.isExpired()) {
      this.status = ReservationStatus.EXPIRED;
      this.updatedAt = new Date();
    }
  }

  extendExpiration(minutes: number = 30): void {
    if (this.status === ReservationStatus.PENDING || this.status === ReservationStatus.PAYMENT_PENDING) {
      this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
      this.updatedAt = new Date();
    }
  }

  setPaymentPending(paymentId: string): void {
    this.status = ReservationStatus.PAYMENT_PENDING;
    this.paymentId = paymentId;
    this.updatedAt = new Date();
  }
}
