export interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  parent?: string | null;
  imageUrl?: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  parent?: string | null;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
}
