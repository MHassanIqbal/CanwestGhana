export interface Product {
  _id: string;
  name: string;
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
  name: string;
  brand: string;
  category: string;
  description?: string;
}

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}
