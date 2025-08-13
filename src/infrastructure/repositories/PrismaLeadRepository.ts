import { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import { Lead, LeadStatus, Interaction, InteractionType } from '@/domain/entities/Lead';
import { prisma } from '@/infrastructure/database/prisma';
import { logger } from '@/shared/logger';

export class PrismaLeadRepository implements ILeadRepository {
  async create(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>): Promise<Lead> {
    try {
      const lead = await prisma.lead.create({
        data: {
          name: leadData.name,
          phone: leadData.phone,
          cpf: leadData.cpf,
          email: leadData.email,
          source: leadData.source,
          status: leadData.status,
          notes: leadData.notes,
          lastContact: leadData.lastContact
        },
        include: {
          interactions: true
        }
      });

      return this.mapToEntity(lead);
    } catch (error) {
      logger.error('Error creating lead', { error, leadData });
      throw error;
    }
  }

  async findById(id: string): Promise<Lead | null> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          interactions: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      return lead ? this.mapToEntity(lead) : null;
    } catch (error) {
      logger.error('Error finding lead by id', { error, id });
      throw error;
    }
  }

  async findByPhone(phone: string): Promise<Lead | null> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { phone },
        include: {
          interactions: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      return lead ? this.mapToEntity(lead) : null;
    } catch (error) {
      logger.error('Error finding lead by phone', { error, phone });
      throw error;
    }
  }

  async findByCpf(cpf: string): Promise<Lead | null> {
    try {
      const lead = await prisma.lead.findFirst({
        where: { cpf },
        include: {
          interactions: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      return lead ? this.mapToEntity(lead) : null;
    } catch (error) {
      logger.error('Error finding lead by CPF', { error, cpf });
      throw error;
    }
  }

  async findByStatus(status: LeadStatus): Promise<Lead[]> {
    try {
      const leads = await prisma.lead.findMany({
        where: { status },
        include: {
          interactions: {
            orderBy: { timestamp: 'desc' }
          }
        },
        orderBy: { lastContact: 'desc' }
      });

      return leads.map(lead => this.mapToEntity(lead));
    } catch (error) {
      logger.error('Error finding leads by status', { error, status });
      throw error;
    }
  }

  async findForFollowUp(): Promise<Lead[]> {
    try {
      const now = new Date();
      const leads = await prisma.lead.findMany({
        where: {
          status: {
            in: [
              LeadStatus.NEW,
              LeadStatus.CONTACTED,
              LeadStatus.INTERESTED,
              LeadStatus.QUALIFIED,
              LeadStatus.PROPOSAL_SENT,
              LeadStatus.NEGOTIATING
            ]
          }
        },
        include: {
          interactions: {
            orderBy: { timestamp: 'desc' }
          }
        },
        orderBy: { lastContact: 'asc' }
      });

      // Filter leads that need follow-up based on business rules
      return leads
        .map(lead => this.mapToEntity(lead))
        .filter(lead => {
          const hoursSinceLastContact = (now.getTime() - lead.lastContact.getTime()) / (1000 * 60 * 60);
          
          switch (lead.status) {
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
        });
    } catch (error) {
      logger.error('Error finding leads for follow-up', { error });
      throw error;
    }
  }

  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    try {
      const lead = await prisma.lead.update({
        where: { id },
        data: {
          name: data.name,
          cpf: data.cpf,
          email: data.email,
          source: data.source,
          status: data.status,
          notes: data.notes,
          lastContact: data.lastContact
        },
        include: {
          interactions: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      return this.mapToEntity(lead);
    } catch (error) {
      logger.error('Error updating lead', { error, id, data });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.lead.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      logger.error('Error deleting lead', { error, id });
      return false;
    }
  }

  async addInteraction(leadId: string, interaction: Omit<Interaction, 'id'>): Promise<Lead> {
    try {
      await prisma.interaction.create({
        data: {
          type: interaction.type,
          content: interaction.content,
          metadata: interaction.metadata ? JSON.stringify(interaction.metadata) : null,
          timestamp: interaction.timestamp,
          leadId
        }
      });

      // Update last contact time
      await prisma.lead.update({
        where: { id: leadId },
        data: { lastContact: new Date() }
      });

      // Return updated lead
      const updatedLead = await this.findById(leadId);
      if (!updatedLead) {
        throw new Error('Lead not found after adding interaction');
      }

      return updatedLead;
    } catch (error) {
      logger.error('Error adding interaction', { error, leadId, interaction });
      throw error;
    }
  }

  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    conversionRate: number;
  }> {
    try {
      const [total, statusCounts, converted] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.lead.count({
          where: { status: LeadStatus.CONVERTED }
        })
      ]);

      const byStatus = Object.values(LeadStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {} as Record<LeadStatus, number>);

      statusCounts.forEach(item => {
        byStatus[item.status as LeadStatus] = item._count.status;
      });

      const conversionRate = total > 0 ? (converted / total) * 100 : 0;

      return {
        total,
        byStatus,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting lead stats', { error });
      throw error;
    }
  }

  async list(limit: number = 50, offset: number = 0): Promise<Lead[]> {
    try {
      const leads = await prisma.lead.findMany({
        include: {
          interactions: {
            orderBy: { timestamp: 'desc' },
            take: 5 // Only include last 5 interactions for performance
          }
        },
        orderBy: { lastContact: 'desc' },
        take: limit,
        skip: offset
      });

      return leads.map(lead => this.mapToEntity(lead));
    } catch (error) {
      logger.error('Error listing leads', { error, limit, offset });
      throw error;
    }
  }

  private mapToEntity(data: any): Lead {
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      cpf: data.cpf,
      email: data.email,
      source: data.source,
      status: data.status,
      notes: data.notes,
      lastContact: data.lastContact,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      interactions: data.interactions?.map((interaction: any): Interaction => ({
        id: interaction.id,
        type: interaction.type,
        content: interaction.content,
        metadata: interaction.metadata ? JSON.parse(interaction.metadata) : undefined,
        timestamp: interaction.timestamp
      })) || []
    };
  }
}
