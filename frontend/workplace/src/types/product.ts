export interface Product {
  _id: string;
  title: string; // Replaced name with title
  summary?: string; // Added optional summary field
  slug: string;
  brand: string;
  category: string;
  description?: string;
  images: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  title: string; // Replaced name with title
  summary?: string; // Added optional summary field
  brand: string;
  category: string;
  description?: string;
}

export interface UpdateProductInput {
  title?: string; // Replaced name with title
  summary?: string; // Added optional summary field
  brand?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface ProductSearchOption {
  product: string;
  variant: string | null;
  label: string;
  title: string;
  sku: string | null;
  attributes: { name: string; value: string }[];
  priceUsd: number | null;
}
