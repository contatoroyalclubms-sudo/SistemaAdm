import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product, ProductType } from '@/domain/entities/Product';
import { prisma } from '@/infrastructure/database/prisma';
import { logger } from '@/shared/logger';

export class PrismaProductRepository implements IProductRepository {
  async create(productData: Omit<Product, 'id'>): Promise<Product> {
    try {
      const product = await prisma.product.create({
        data: {
          type: productData.type,
          name: productData.name,
          description: productData.description,
          capacity: productData.capacity,
          minimumConsumption: productData.minimumConsumption,
          price: productData.price,
          sectorMap: productData.sectorMap ? JSON.stringify(productData.sectorMap) : null,
          isActive: productData.isActive,
          eventId: productData.eventId
        }
      });

      return this.mapToEntity(product);
    } catch (error) {
      logger.error('Error creating product', { error, productData });
      throw error;
    }
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const product = await prisma.product.findUnique({
        where: { id }
      });

      return product ? this.mapToEntity(product) : null;
    } catch (error) {
      logger.error('Error finding product by id', { error, id });
      throw error;
    }
  }

  async findByEventId(eventId: string): Promise<Product[]> {
    try {
      const products = await prisma.product.findMany({
        where: { eventId },
        orderBy: { price: 'asc' }
      });

      return products.map(product => this.mapToEntity(product));
    } catch (error) {
      logger.error('Error finding products by event id', { error, eventId });
      throw error;
    }
  }

  async findByType(type: ProductType): Promise<Product[]> {
    try {
      const products = await prisma.product.findMany({
        where: { type },
        orderBy: { price: 'asc' }
      });

      return products.map(product => this.mapToEntity(product));
    } catch (error) {
      logger.error('Error finding products by type', { error, type });
      throw error;
    }
  }

  async findAvailable(eventId?: string): Promise<Product[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(eventId && { eventId })
        },
        orderBy: { price: 'asc' }
      });

      return products.map(product => this.mapToEntity(product));
    } catch (error) {
      logger.error('Error finding available products', { error, eventId });
      throw error;
    }
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          type: data.type,
          name: data.name,
          description: data.description,
          capacity: data.capacity,
          minimumConsumption: data.minimumConsumption,
          price: data.price,
          sectorMap: data.sectorMap ? JSON.stringify(data.sectorMap) : undefined,
          isActive: data.isActive
        }
      });

      return this.mapToEntity(product);
    } catch (error) {
      logger.error('Error updating product', { error, id, data });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.product.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      logger.error('Error deleting product', { error, id });
      return false;
    }
  }

  async updateCapacity(id: string, newCapacity: number): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: { capacity: newCapacity }
      });

      return this.mapToEntity(product);
    } catch (error) {
      logger.error('Error updating product capacity', { error, id, newCapacity });
      throw error;
    }
  }

  async list(limit: number = 50, offset: number = 0): Promise<Product[]> {
    try {
      const products = await prisma.product.findMany({
        orderBy: { price: 'asc' },
        take: limit,
        skip: offset
      });

      return products.map(product => this.mapToEntity(product));
    } catch (error) {
      logger.error('Error listing products', { error, limit, offset });
      throw error;
    }
  }

  private mapToEntity(data: any): Product {
    return {
      id: data.id,
      type: data.type,
      name: data.name,
      description: data.description,
      capacity: data.capacity,
      minimumConsumption: data.minimumConsumption ? Number(data.minimumConsumption) : undefined,
      price: Number(data.price),
      sectorMap: data.sectorMap ? JSON.parse(data.sectorMap) : undefined,
      isActive: data.isActive,
      eventId: data.eventId
    };
  }
}
