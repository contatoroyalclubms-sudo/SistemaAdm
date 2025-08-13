import { Product, ProductType } from '@/domain/entities/Product';

export interface IProductRepository {
  create(product: Omit<Product, 'id'>): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findByEventId(eventId: string): Promise<Product[]>;
  findByType(type: ProductType): Promise<Product[]>;
  findAvailable(eventId?: string): Promise<Product[]>;
  update(id: string, data: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<boolean>;
  updateCapacity(id: string, newCapacity: number): Promise<Product>;
  list(limit?: number, offset?: number): Promise<Product[]>;
}
