export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandInput {
  name: string;
  logoUrl?: string;
  description?: string;
}

export interface UpdateBrandInput {
  name?: string;
  logoUrl?: string;
  description?: string;
  isActive?: boolean;
}
