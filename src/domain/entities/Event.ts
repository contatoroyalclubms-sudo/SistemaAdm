export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SOLD_OUT = 'SOLD_OUT',
  CANCELLED = 'CANCELLED',
  FINISHED = 'FINISHED'
}

export interface Lot {
  id: string;
  name: string;
  price: number;
  validUntil: Date;
  isActive: boolean;
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  openingTime: Date;
  headliner: string;
  description?: string;
  venue: string;
  status: EventStatus;
  lots: Lot[];
  createdAt: Date;
  updatedAt: Date;
}

export class EventEntity implements Event {
  constructor(
    public id: string,
    public name: string,
    public date: Date,
    public openingTime: Date,
    public headliner: string = 'MC Daniel Falcão',
    public description: string | undefined = undefined,
    public venue: string = 'Royal Club',
    public status: EventStatus = EventStatus.ACTIVE,
    public lots: Lot[] = [],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  isActive(): boolean {
    return this.status === EventStatus.ACTIVE;
  }

  isSoldOut(): boolean {
    return this.status === EventStatus.SOLD_OUT;
  }

  isUpcoming(): boolean {
    return this.date > new Date() && this.isActive();
  }

  getCurrentLot(): Lot | null {
    const now = new Date();
    const activeLots = this.lots
      .filter(lot => lot.isActive && lot.validUntil > now)
      .sort((a, b) => a.price - b.price);
    
    return activeLots[0] || null;
  }

  getLowestPrice(): number | null {
    const currentLot = this.getCurrentLot();
    return currentLot?.price || null;
  }

  addLot(lot: Lot): void {
    this.lots.push(lot);
    this.updatedAt = new Date();
  }

  updateStatus(status: EventStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }
}
