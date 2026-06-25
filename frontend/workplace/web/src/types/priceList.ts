export interface PriceListAttribute {
  name: string;
  value: string;
}

export interface PriceListResult {
  variantId: string;
  productId: string;
  productName: string;
  brandName: string | null;
  categoryName: string | null;
  sku: string;
  attributes: PriceListAttribute[];
  imageUrl: string | null;
  priceUsd: number;
  priceGhs: number;
  priceUsdWithTax: number;
  priceGhsWithTax: number;
  totalStock: number;
}

export interface PriceListResponse {
  rate: number;
  taxRate: number;
  results: PriceListResult[];
}
