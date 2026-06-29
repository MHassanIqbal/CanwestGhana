export interface BusinessDay {
  open?: string;
  close?: string;
  closed: boolean;
}

export interface BusinessHours {
  monday: BusinessDay;
  tuesday: BusinessDay;
  wednesday: BusinessDay;
  thursday: BusinessDay;
  friday: BusinessDay;
  saturday: BusinessDay;
  sunday: BusinessDay;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  whatsapp?: string;
}

export interface Company {
  _id: string;
  companyName: string;
  slogan?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  usdToGhsRate: number;
  taxRate: number;
  socialLinks?: SocialLinks;
  businessHours?: BusinessHours;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyInput {
  companyName?: string;
  slogan?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  usdToGhsRate?: number;
  taxRate?: number;
  socialLinks?: SocialLinks;
  businessHours?: BusinessHours;
}
