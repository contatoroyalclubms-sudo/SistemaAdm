export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  INTERESTED = 'INTERESTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATING = 'NEGOTIATING',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}

export enum InteractionType {
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  CALL_MADE = 'CALL_MADE',
  EMAIL_SENT = 'EMAIL_SENT',
  NOTE_ADDED = 'NOTE_ADDED',
  STATUS_CHANGED = 'STATUS_CHANGED'
}

export interface Interaction {
  id: string;
  type: InteractionType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
  source: string;
  status: LeadStatus;
  notes?: string;
  lastContact: Date;
  createdAt: Date;
  updatedAt: Date;
  interactions: Interaction[];
}

export class LeadEntity implements Lead {
  constructor(
    public id: string,
    public name: string,
    public phone: string,
    public cpf: string | undefined = undefined,
    public email: string | undefined = undefined,
    public source: string = 'whatsapp',
    public status: LeadStatus = LeadStatus.NEW,
    public notes: string | undefined = undefined,
    public lastContact: Date = new Date(),
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public interactions: Interaction[] = []
  ) {}

  isQualified(): boolean {
    return [
      LeadStatus.QUALIFIED,
      LeadStatus.PROPOSAL_SENT,
      LeadStatus.NEGOTIATING,
      LeadStatus.CONVERTED
    ].includes(this.status);
  }

  isActive(): boolean {
    return ![LeadStatus.CONVERTED, LeadStatus.LOST].includes(this.status);
  }

  shouldFollowUp(): boolean {
    const hoursSinceLastContact = this.getHoursSinceLastContact();
    
    switch (this.status) {
      case LeadStatus.NEW:
        return hoursSinceLastContact >= 1;
      case LeadStatus.CONTACTED:
      case LeadStatus.INTERESTED:
        return hoursSinceLastContact >= 24;
      case LeadStatus.QUALIFIED:
      case LeadStatus.PROPOSAL_SENT:
        return hoursSinceLastContact >= 12;
      case LeadStatus.NEGOTIATING:
        return hoursSinceLastContact >= 6;
      default:
        return false;
    }
  }

  getHoursSinceLastContact(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.lastContact.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  addInteraction(interaction: Omit<Interaction, 'id'>): void {
    const newInteraction: Interaction = {
      ...interaction,
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.interactions.push(newInteraction);
    this.lastContact = new Date();
    this.updatedAt = new Date();
  }

  updateStatus(newStatus: LeadStatus, notes?: string): void {
    const oldStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();
    
    if (notes) {
      this.notes = notes;
    }
    
    this.addInteraction({
      type: InteractionType.STATUS_CHANGED,
      content: `Status alterado de ${oldStatus} para ${newStatus}`,
      metadata: { oldStatus, newStatus, notes },
      timestamp: new Date()
    });
  }

  getFormattedPhone(): string {
    // Remove non-digits and format as Brazilian phone
    const digits = this.phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return this.phone;
  }

  getLastInteraction(): Interaction | null {
    if (this.interactions.length === 0) return null;
    const sorted = this.interactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return sorted[0] || null;
  }
}
