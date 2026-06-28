export interface PriceListAttribute {
  name: string;
  value: string;
}

export interface PriceListResult {
  variantId: string | null; // null when the product has no variant yet
  productId: string;
  productName: string;
  brandName: string | null;
  categoryName: string | null;
  sku: string | null;
  attributes: PriceListAttribute[];
  imageUrl: string | null;
  priceUsd: number | null;
  priceGhs: number | null;
  priceUsdWithTax: number | null;
  priceGhsWithTax: number | null;
  totalStock: number;
}

export interface PriceListResponse {
  rate: number;
  taxRate: number;
  results: PriceListResult[];
}
