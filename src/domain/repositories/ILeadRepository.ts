import { Lead, LeadStatus } from '@/domain/entities/Lead';

export interface ILeadRepository {
  create(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>): Promise<Lead>;
  findById(id: string): Promise<Lead | null>;
  findByPhone(phone: string): Promise<Lead | null>;
  findByCpf(cpf: string): Promise<Lead | null>;
  findByStatus(status: LeadStatus): Promise<Lead[]>;
  findForFollowUp(): Promise<Lead[]>;
  update(id: string, data: Partial<Lead>): Promise<Lead>;
  delete(id: string): Promise<boolean>;
  addInteraction(leadId: string, interaction: any): Promise<Lead>;
  getLeadStats(): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    conversionRate: number;
  }>;
  list(limit?: number, offset?: number): Promise<Lead[]>;
}
