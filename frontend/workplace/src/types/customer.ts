export interface Customer {
  _id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tin: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tin: string | null;
}

export interface UpdateCustomerInput {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tin: string | null;
}
