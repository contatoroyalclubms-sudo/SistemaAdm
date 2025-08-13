import { beforeAll, afterAll } from 'vitest';
import { prisma } from '@/infrastructure/database/prisma';
import app from '@/index';

export let testApp: any;

beforeAll(async () => {
  // Setup E2E test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./e2e-test.db';
  process.env.API_KEY = 'test-api-key';
  process.env.PORT = '3001';
  
  testApp = app;
  
  // Clean database
  await cleanDatabase();
  
  // Seed test data
  await seedTestData();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

async function cleanDatabase() {
  await prisma.interaction.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.product.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.event.deleteMany();
  await prisma.config.deleteMany();
}

async function seedTestData() {
  // Create test event
  const event = await prisma.event.create({
    data: {
      name: 'Test Event - MC Daniel Falcão',
      date: new Date('2025-02-15T22:00:00.000Z'),
      openingTime: new Date('2025-02-15T20:00:00.000Z'),
      headliner: 'MC Daniel Falcão',
      venue: 'Royal Club',
      status: 'ACTIVE'
    }
  });

  // Create test products
  await prisma.product.createMany({
    data: [
      {
        type: 'INGRESSO',
        name: 'Ingresso Teste',
        capacity: 100,
        price: 80.00,
        eventId: event.id,
        isActive: true
      },
      {
        type: 'BISTRO',
        name: 'Mesa Bistrô Teste',
        capacity: 6,
        minimumConsumption: 300.00,
        price: 150.00,
        eventId: event.id,
        isActive: true
      }
    ]
  });

  // Create test lead
  await prisma.lead.create({
    data: {
      name: 'João Teste',
      phone: '5511999999999',
      cpf: '12345678901',
      email: 'joao@teste.com',
      source: 'whatsapp',
      status: 'NEW'
    }
  });
}
