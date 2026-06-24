export interface Location {
  _id: string;
  name: string;
  slug: string;
  type: "warehouse" | "branch";
  address?: string;
  city?: string;
  phone?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationInput {
  name: string;
  type: "warehouse" | "branch";
  address?: string;
  city?: string;
  phone?: string;
}

export interface UpdateLocationInput {
  name?: string;
  type?: "warehouse" | "branch";
  address?: string;
  city?: string;
  phone?: string;
  isActive?: boolean;
}
