import { beforeAll, afterAll } from 'vitest';
import { prisma } from '@/infrastructure/database/prisma';

beforeAll(async () => {
  // Setup test database
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./test.db';
  
  // Clean database before tests
  await cleanDatabase();
});

afterAll(async () => {
  // Clean up after tests
  await cleanDatabase();
  await prisma.$disconnect();
});

async function cleanDatabase() {
  // Delete all data in reverse order of dependencies
  await prisma.interaction.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.product.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.event.deleteMany();
  await prisma.config.deleteMany();
}
