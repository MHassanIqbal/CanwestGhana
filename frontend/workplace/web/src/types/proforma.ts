import type { Staff } from "@/types/staff";
import type { Customer } from "@/types/customer";

export interface ProductSnapshot {
  name: string;
  sku: string | null;
  attributes: { name: string; value: string }[];
}

export interface LineItem {
  _id: string;
  product: string | null;
  variant: string | null;
  productSnapshot: ProductSnapshot;
  quantity: number;
  unitPriceGhs: number;
  totalGhs: number;
}

export interface CustomerSnapshot {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tin: string | null;
}

export interface Proforma {
  _id: string;
  proformaNumber: string;
  verificationToken: string;
  sender: Pick<Staff, "_id" | "firstName" | "lastName" | "email">;
  customer: Pick<Customer, "_id" | "name" | "email" | "phone"> | null;
  customerSnapshot: CustomerSnapshot;
  lineItems: LineItem[];
  ghsRate: number;
  subtotalGhs: number;
  discountGhs: number;
  taxPercent: number;
  taxGhs: number;
  totalGhs: number;
  // Null while still a draft. Set the first time a PDF is generated —
  // from that point the record is locked; edits go through /duplicate.
  issuedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItemInput {
  product?: string | null;
  variant?: string | null;
  productSnapshot?: {
    name: string;
    sku?: string | null;
    attributes?: { name: string; value: string }[];
  };
  quantity: number;
  unitPriceGhs: number;
}

export interface CreateProformaInput {
  customerSnapshot: CustomerSnapshot;
  customer?: string | null;
  lineItems: LineItemInput[];
  discountGhs?: number;
  taxPercent?: number;
}

export type UpdateProformaInput = Partial<CreateProformaInput>;

// Returned by the staff-only verify endpoint — a summary, not the full record
export interface ProformaVerificationResult {
  success: boolean;
  proformaNumber: string;
  issuedBy: string | null;
  issuedOn: string;
  customerName: string;
  totalGhs: number;
}
