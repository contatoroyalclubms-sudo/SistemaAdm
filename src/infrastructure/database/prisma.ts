import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances during hot reload in development
const prisma = globalThis.__prisma || new PrismaClient();


if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };

// Helper function to handle database connection
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

// Helper function to disconnect database
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database', { error });
  }
}
