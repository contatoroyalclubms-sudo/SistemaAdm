import { z } from 'zod';
import { ProductType } from '@/domain/entities/Product';
import { LeadStatus } from '@/domain/entities/Lead';
import { ReservationStatus } from '@/domain/entities/Reservation';
import { EventStatus } from '@/domain/entities/Event';

// Phone validation for Brazilian numbers
const phoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Formato de telefone inválido');

// CPF validation (basic format check)
const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF deve estar no formato 000.000.000-00 ou conter 11 dígitos');

// Event DTOs
export const CreateEventDto = z.object({
  name: z.string().min(1, 'Nome do evento é obrigatório'),
  date: z.string().datetime('Data deve estar no formato ISO 8601'),
  openingTime: z.string().datetime('Horário de abertura deve estar no formato ISO 8601'),
  headliner: z.string().default('MC Daniel Falcão'),
  description: z.string().optional(),
  venue: z.string().default('Royal Club'),
  status: z.nativeEnum(EventStatus).default(EventStatus.ACTIVE)
});

export const UpdateEventDto = CreateEventDto.partial();

// Product DTOs
export const CreateProductDto = z.object({
  type: z.nativeEnum(ProductType),
  name: z.string().min(1, 'Nome do produto é obrigatório'),
  description: z.string().optional(),
  capacity: z.number().int().positive('Capacidade deve ser um número positivo'),
  minimumConsumption: z.number().positive().optional(),
  price: z.number().positive('Preço deve ser um número positivo'),
  sectorMap: z.record(z.any()).optional(),
  eventId: z.string().cuid('ID do evento inválido')
});

export const UpdateProductDto = CreateProductDto.partial().omit({ eventId: true });

// Lead DTOs
export const CreateLeadDto = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: phoneSchema,
  cpf: cpfSchema.optional(),
  email: z.string().email('Email inválido').optional(),
  source: z.string().default('whatsapp'),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  notes: z.string().optional()
});

export const UpdateLeadDto = CreateLeadDto.partial().omit({ phone: true });

// Reservation DTOs
export const CreateReservationDto = z.object({
  quantity: z.number().int().positive('Quantidade deve ser um número positivo'),
  totalAmount: z.number().positive('Valor total deve ser um número positivo'),
  notes: z.string().optional(),
  leadId: z.string().cuid('ID do lead inválido'),
  productId: z.string().cuid('ID do produto inválido'),
  eventId: z.string().cuid('ID do evento inválido')
});

export const UpdateReservationDto = z.object({
  status: z.nativeEnum(ReservationStatus).optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional()
});

// WhatsApp Message DTOs
export const WhatsAppMessageDto = z.object({
  from: z.string().min(1, 'Remetente é obrigatório'),
  to: z.string().min(1, 'Destinatário é obrigatório'),
  body: z.string().min(1, 'Mensagem não pode estar vazia'),
  timestamp: z.number().optional(),
  messageId: z.string().optional(),
  type: z.enum(['text', 'image', 'audio', 'video', 'document']).default('text')
});

// Sales Funnel DTOs
export const QuoteRequestDto = z.object({
  productType: z.nativeEnum(ProductType),
  quantity: z.number().int().positive().max(20, 'Máximo 20 pessoas por reserva'),
  customerName: z.string().min(1, 'Nome é obrigatório'),
  customerPhone: phoneSchema,
  eventId: z.string().cuid('ID do evento inválido').optional()
});

export const BookingRequestDto = z.object({
  productId: z.string().cuid('ID do produto inválido'),
  quantity: z.number().int().positive().max(20, 'Máximo 20 pessoas por reserva'),
  customerName: z.string().min(1, 'Nome é obrigatório'),
  customerPhone: phoneSchema,
  customerCpf: cpfSchema.optional(),
  customerEmail: z.string().email('Email inválido').optional(),
  notes: z.string().optional()
});

// API Response DTOs
export const ApiResponseDto = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().datetime().default(() => new Date().toISOString())
});

// Configuration DTOs
export const ConfigDto = z.object({
  key: z.string().min(1, 'Chave de configuração é obrigatória'),
  value: z.any(),
  description: z.string().optional()
});

// Webhook DTOs
export const StripeWebhookDto = z.object({
  id: z.string(),
  object: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any()
  }),
  created: z.number()
});

// Export types
export type CreateEventInput = z.infer<typeof CreateEventDto>;
export type UpdateEventInput = z.infer<typeof UpdateEventDto>;
export type CreateProductInput = z.infer<typeof CreateProductDto>;
export type UpdateProductInput = z.infer<typeof UpdateProductDto>;
export type CreateLeadInput = z.infer<typeof CreateLeadDto>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadDto>;
export type CreateReservationInput = z.infer<typeof CreateReservationDto>;
export type UpdateReservationInput = z.infer<typeof UpdateReservationDto>;
export type WhatsAppMessageInput = z.infer<typeof WhatsAppMessageDto>;
export type QuoteRequestInput = z.infer<typeof QuoteRequestDto>;
export type BookingRequestInput = z.infer<typeof BookingRequestDto>;
export type ApiResponseOutput = z.infer<typeof ApiResponseDto>;
export type ConfigInput = z.infer<typeof ConfigDto>;
export type StripeWebhookInput = z.infer<typeof StripeWebhookDto>;
