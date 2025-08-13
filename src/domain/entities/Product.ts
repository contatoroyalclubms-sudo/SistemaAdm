export enum ProductType {
  CAMAROTE = 'CAMAROTE',
  BISTRO = 'BISTRO',
  INGRESSO = 'INGRESSO'
}

export interface SectorMap {
  sectors: Array<{
    id: string;
    name: string;
    capacity: number;
    available: number;
  }>;
}

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  description?: string;
  capacity: number;
  minimumConsumption?: number;
  price: number;
  sectorMap?: SectorMap;
  isActive: boolean;
  eventId: string;
}

export class ProductEntity implements Product {
  constructor(
    public id: string,
    public type: ProductType,
    public name: string,
    public description: string | undefined = undefined,
    public capacity: number,
    public minimumConsumption: number | undefined = undefined,
    public price: number,
    public sectorMap: SectorMap | undefined = undefined,
    public isActive: boolean = true,
    public eventId: string
  ) {}

  isAvailable(): boolean {
    return this.isActive && this.getAvailableCapacity() > 0;
  }

  getAvailableCapacity(): number {
    if (!this.sectorMap) {
      return this.capacity;
    }
    
    return this.sectorMap.sectors.reduce((total, sector) => total + sector.available, 0);
  }

  getFormattedPrice(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.price);
  }

  getMinimumConsumptionFormatted(): string | null {
    if (!this.minimumConsumption) return null;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.minimumConsumption);
  }

  getUpsellSuggestion(): ProductType | null {
    switch (this.type) {
      case ProductType.INGRESSO:
        return ProductType.BISTRO;
      case ProductType.BISTRO:
        return ProductType.CAMAROTE;
      default:
        return null;
    }
  }

  getDescription(): string {
    let desc = this.description || '';
    
    if (this.minimumConsumption) {
      desc += `\n💰 Consumação mínima: ${this.getMinimumConsumptionFormatted()}`;
    }
    
    desc += `\n👥 Capacidade: ${this.capacity} pessoas`;
    desc += `\n✅ Disponível: ${this.getAvailableCapacity()} vagas`;
    
    return desc.trim();
  }
}
