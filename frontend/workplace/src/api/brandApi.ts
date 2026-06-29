import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type { Brand, CreateBrandInput, UpdateBrandInput } from "@/types/brand";

export const brandApi = {
  getAllBrands: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get<{ brands: Brand[] }>(
      ENDPOINTS.brand.getAll,
    );
    return data.brands;
  },

  getBrandById: async (id: string): Promise<Brand> => {
    const { data } = await apiClient.get<{ brand: Brand }>(
      ENDPOINTS.brand.getById(id),
    );
    return data.brand;
  },

  createBrand: async (input: CreateBrandInput): Promise<Brand> => {
    const { data } = await apiClient.post<{ success: boolean; brand: Brand }>(
      ENDPOINTS.brand.create,
      input,
    );
    return data.brand;
  },

  updateBrand: async (id: string, input: UpdateBrandInput): Promise<Brand> => {
    const { data } = await apiClient.put<{ success: boolean; brand: Brand }>(
      ENDPOINTS.brand.update(id),
      input,
    );
    return data.brand;
  },

  deleteBrand: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.brand.delete(id));
  },

  uploadLogo: async (id: string, file: File): Promise<Brand> => {
    const formData = new FormData();
    formData.append("logo", file);

    const { data } = await apiClient.put<{ success: boolean; brand: Brand }>(
      ENDPOINTS.brand.uploadLogo(id),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.brand;
  },
};
