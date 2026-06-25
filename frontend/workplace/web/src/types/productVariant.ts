export interface ProductVariantAttribute {
  name: string;
  value: string;
}

export interface StockLine {
  location: string;
  quantity: number;
}

export interface ProductVariant {
  _id: string;
  product: string;
  sku: string;
  attributes: ProductVariantAttribute[];
  priceUsd: number;
  stock: StockLine[];
  totalStock: number; // virtual — included via toJSON virtuals: true on the backend
  imageUrl?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantInput {
  product: string;
  sku: string;
  attributes: ProductVariantAttribute[];
  priceUsd: number;
}

export interface UpdateVariantInput {
  sku?: string;
  attributes?: ProductVariantAttribute[];
  priceUsd?: number;
  isActive?: boolean;
}

export type StockAction = "add" | "remove" | "set";

export interface AdjustStockInput {
  location: string;
  action: StockAction;
  quantity: number;
}
