import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SalesFunnelUseCase } from './SalesFunnelUseCase';
import { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { IEventRepository } from '@/domain/repositories/IEventRepository';
import { IReservationRepository } from '@/domain/repositories/IReservationRepository';
import { LeadEntity, LeadStatus } from '@/domain/entities/Lead';
import { ProductEntity, ProductType } from '@/domain/entities/Product';
import { EventEntity, EventStatus } from '@/domain/entities/Event';

// Mock repositories
const mockLeadRepository: ILeadRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByPhone: vi.fn(),
  findByCpf: vi.fn(),
  findByStatus: vi.fn(),
  findForFollowUp: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  addInteraction: vi.fn(),
  getLeadStats: vi.fn(),
  list: vi.fn()
};

const mockProductRepository: IProductRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByEventId: vi.fn(),
  findByType: vi.fn(),
  findAvailable: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  updateCapacity: vi.fn(),
  list: vi.fn()
};

const mockEventRepository: IEventRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByStatus: vi.fn(),
  findUpcoming: vi.fn(),
  findActive: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn()
};

const mockReservationRepository: IReservationRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByLeadId: vi.fn(),
  findByEventId: vi.fn(),
  findByStatus: vi.fn(),
  findExpired: vi.fn(),
  findPendingPayment: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  confirmPayment: vi.fn(),
  markAsExpired: vi.fn(),
  getReservationStats: vi.fn(),
  list: vi.fn()
};

describe('SalesFunnelUseCase', () => {
  let salesFunnel: SalesFunnelUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    salesFunnel = new SalesFunnelUseCase(
      mockLeadRepository,
      mockProductRepository,
      mockEventRepository,
      mockReservationRepository
    );
  });

  describe('processMessage', () => {
    it('should create new lead when not found and name provided', async () => {
      const phone = '5511999999999';
      const message = 'oi';
      const customerName = 'João Silva';

      mockLeadRepository.findByPhone = vi.fn().mockResolvedValue(null);
      mockLeadRepository.create = vi.fn().mockResolvedValue(
        new LeadEntity('lead_1', customerName, phone)
      );
      mockLeadRepository.update = vi.fn().mockResolvedValue(
        new LeadEntity('lead_1', customerName, phone)
      );

      const response = await salesFunnel.processMessage(phone, message, customerName);

      expect(mockLeadRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: customerName,
          phone: phone
        })
      );
      expect(response.leadId).toBe('lead_1');
      expect(response.message).toContain('Bem-vindo');
    });

    it('should ask for name when lead not found and no name provided', async () => {
      const phone = '5511999999999';
      const message = 'oi';

      mockLeadRepository.findByPhone = vi.fn().mockResolvedValue(null);

      const response = await salesFunnel.processMessage(phone, message);

      expect(response.message).toContain('preciso que me informe seu nome');
      expect(response.nextStep).toBe('collect_name');
    });

    it('should return main menu for menu requests', async () => {
      const phone = '5511999999999';
      const message = 'menu';
      const lead = new LeadEntity('lead_1', 'João', phone);

      mockLeadRepository.findByPhone = vi.fn().mockResolvedValue(lead);
      mockLeadRepository.update = vi.fn().mockResolvedValue(lead);

      const response = await salesFunnel.processMessage(phone, message);

      expect(response.message).toContain('ROYAL CLUB');
      expect(response.message).toContain('Ingressos');
      expect(response.message).toContain('Bistrô');
      expect(response.message).toContain('Camarote');
      expect(response.options).toContain('ingressos');
    });

    it('should provide product info for product interest', async () => {
      const phone = '5511999999999';
      const message = 'camarote';
      const lead = new LeadEntity('lead_1', 'João', phone);
      
      const product = new ProductEntity(
        'product_1',
        ProductType.CAMAROTE,
        'Camarote VIP',
        'Experiência premium',
        10,
        800,
        250,
        undefined,
        true,
        'event_1'
      );

      mockLeadRepository.findByPhone = vi.fn().mockResolvedValue(lead);
      mockLeadRepository.update = vi.fn().mockResolvedValue(lead);
      mockProductRepository.findByType = vi.fn().mockResolvedValue([product]);

      const response = await salesFunnel.processMessage(phone, message);

      expect(response.message).toContain('CAMAROTE VIP');
      expect(response.message).toContain('R$ 250,00');
      expect(response.message).toContain('10 pessoas');
      expect(lead.status).toBe(LeadStatus.INTERESTED);
    });

    it('should provide availability info', async () => {
      const phone = '5511999999999';
      const message = 'disponibilidade';
      const lead = new LeadEntity('lead_1', 'João', phone);
      
      const event = new EventEntity(
        'event_1',
        'MC Daniel Falcão',
        new Date('2025-02-15'),
        new Date('2025-02-15T20:00:00Z'),
        'MC Daniel Falcão',
        'Show especial',
        'Royal Club',
        EventStatus.ACTIVE
      );

      const products = [
        new ProductEntity('p1', ProductType.INGRESSO, 'Ingresso', undefined, 100, undefined, 80, undefined, true, 'event_1'),
        new ProductEntity('p2', ProductType.BISTRO, 'Bistrô', undefined, 6, 300, 150, undefined, true, 'event_1')
      ];

      mockLeadRepository.findByPhone = vi.fn().mockResolvedValue(lead);
      mockLeadRepository.update = vi.fn().mockResolvedValue(lead);
      mockEventRepository.findUpcoming = vi.fn().mockResolvedValue([event]);
      mockProductRepository.findByEventId = vi.fn().mockResolvedValue(products);

      const response = await salesFunnel.processMessage(phone, message);

      expect(response.message).toContain('MC Daniel Falcão');
      expect(response.message).toContain('Royal Club');
      expect(response.message).toContain('DISPONIBILIDADE');
      expect(response.message).toContain('INGRESSO');
      expect(response.message).toContain('BISTRO');
    });

    it('should handle escalation for unknown messages', async () => {
      const phone = '5511999999999';
      const message = 'algo completamente aleatório que não faz sentido';
      const lead = new LeadEntity('lead_1', 'João', phone);

      mockLeadRepository.findByPhone = vi.fn().mockResolvedValue(lead);
      mockLeadRepository.update = vi.fn().mockResolvedValue(lead);

      const response = await salesFunnel.processMessage(phone, message);

      expect(response.message).toContain('Não entendi');
      expect(response.message).toContain('menu');
      expect(response.options).toContain('ajuda');
    });

    it('should handle error gracefully', async () => {
      const phone = '5511999999999';
      const message = 'test';

      mockLeadRepository.findByPhone = vi.fn().mockRejectedValue(new Error('Database error'));

      const response = await salesFunnel.processMessage(phone, message);

      expect(response.message).toContain('erro');
      expect(response.shouldEscalate).toBe(true);
    });
  });
});
