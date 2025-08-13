import { describe, it, expect } from 'vitest';
import { LeadEntity, LeadStatus, InteractionType } from './Lead';

describe('LeadEntity', () => {
  it('should create a new lead with default values', () => {
    const lead = new LeadEntity(
      'lead_1',
      'João Silva',
      '5511999999999'
    );

    expect(lead.id).toBe('lead_1');
    expect(lead.name).toBe('João Silva');
    expect(lead.phone).toBe('5511999999999');
    expect(lead.status).toBe(LeadStatus.NEW);
    expect(lead.source).toBe('whatsapp');
    expect(lead.interactions).toHaveLength(0);
  });

  it('should format phone number correctly', () => {
    const lead = new LeadEntity(
      'lead_1',
      'João Silva',
      '11999999999'
    );

    const formatted = lead.getFormattedPhone();
    expect(formatted).toBe('(11) 99999-9999');
  });

  it('should determine if lead is qualified', () => {
    const lead = new LeadEntity('lead_1', 'João', '11999999999');
    
    expect(lead.isQualified()).toBe(false);
    
    lead.updateStatus(LeadStatus.QUALIFIED);
    expect(lead.isQualified()).toBe(true);
    
    lead.updateStatus(LeadStatus.CONVERTED);
    expect(lead.isQualified()).toBe(true);
  });

  it('should determine if lead is active', () => {
    const lead = new LeadEntity('lead_1', 'João', '11999999999');
    
    expect(lead.isActive()).toBe(true);
    
    lead.updateStatus(LeadStatus.CONVERTED);
    expect(lead.isActive()).toBe(false);
    
    lead.updateStatus(LeadStatus.LOST);
    expect(lead.isActive()).toBe(false);
  });

  it('should add interactions correctly', () => {
    const lead = new LeadEntity('lead_1', 'João', '11999999999');
    
    expect(lead.interactions).toHaveLength(0);
    
    lead.addInteraction({
      type: InteractionType.MESSAGE_RECEIVED,
      content: 'Olá, gostaria de informações',
      timestamp: new Date()
    });
    
    expect(lead.interactions).toHaveLength(1);
    expect(lead.interactions[0].type).toBe(InteractionType.MESSAGE_RECEIVED);
    expect(lead.interactions[0].content).toBe('Olá, gostaria de informações');
  });

  it('should update status and add interaction', () => {
    const lead = new LeadEntity('lead_1', 'João', '11999999999');
    
    lead.updateStatus(LeadStatus.INTERESTED, 'Cliente interessado em camarote');
    
    expect(lead.status).toBe(LeadStatus.INTERESTED);
    expect(lead.notes).toBe('Cliente interessado em camarote');
    expect(lead.interactions).toHaveLength(1);
    expect(lead.interactions[0].type).toBe(InteractionType.STATUS_CHANGED);
  });

  it('should determine follow-up needs correctly', () => {
    const lead = new LeadEntity('lead_1', 'João', '11999999999');
    
    // New lead with recent contact - no follow-up needed
    expect(lead.shouldFollowUp()).toBe(false);
    
    // Set last contact to 2 hours ago
    lead.lastContact = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(lead.shouldFollowUp()).toBe(true);
    
    // Qualified lead with 6 hours ago
    lead.updateStatus(LeadStatus.QUALIFIED);
    lead.lastContact = new Date(Date.now() - 6 * 60 * 60 * 1000);
    expect(lead.shouldFollowUp()).toBe(false);
    
    // Qualified lead with 13 hours ago
    lead.lastContact = new Date(Date.now() - 13 * 60 * 60 * 1000);
    expect(lead.shouldFollowUp()).toBe(true);
  });

  it('should get last interaction', () => {
    const lead = new LeadEntity('lead_1', 'João', '11999999999');
    
    expect(lead.getLastInteraction()).toBeNull();
    
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000);
    
    lead.addInteraction({
      type: InteractionType.MESSAGE_RECEIVED,
      content: 'First message',
      timestamp: earlier
    });
    
    lead.addInteraction({
      type: InteractionType.MESSAGE_SENT,
      content: 'Second message',
      timestamp: now
    });
    
    const lastInteraction = lead.getLastInteraction();
    expect(lastInteraction).not.toBeNull();
    expect(lastInteraction?.content).toBe('Second message');
    expect(lastInteraction?.type).toBe(InteractionType.MESSAGE_SENT);
  });
});
