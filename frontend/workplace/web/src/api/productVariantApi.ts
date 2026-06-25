import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type {
  ProductVariant,
  CreateVariantInput,
  UpdateVariantInput,
  AdjustStockInput,
} from "@/types/productVariant";

export const productVariantApi = {
  getAllVariants: async (productId?: string): Promise<ProductVariant[]> => {
    const { data } = await apiClient.get<{ variants: ProductVariant[] }>(
      ENDPOINTS.productVariant.getAll,
      { params: productId ? { product: productId } : undefined },
    );
    return data.variants;
  },

  getVariantById: async (id: string): Promise<ProductVariant> => {
    const { data } = await apiClient.get<{ variant: ProductVariant }>(
      ENDPOINTS.productVariant.getById(id),
    );
    return data.variant;
  },

  createVariant: async (input: CreateVariantInput): Promise<ProductVariant> => {
    const { data } = await apiClient.post<{
      success: boolean;
      variant: ProductVariant;
    }>(ENDPOINTS.productVariant.create, input);
    return data.variant;
  },

  updateVariant: async (
    id: string,
    input: UpdateVariantInput,
  ): Promise<ProductVariant> => {
    const { data } = await apiClient.put<{
      success: boolean;
      variant: ProductVariant;
    }>(ENDPOINTS.productVariant.update(id), input);
    return data.variant;
  },

  deleteVariant: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.productVariant.delete(id));
  },

  adjustStock: async (
    id: string,
    input: AdjustStockInput,
  ): Promise<ProductVariant> => {
    const { data } = await apiClient.put<{
      success: boolean;
      variant: ProductVariant;
    }>(ENDPOINTS.productVariant.adjustStock(id), input);
    return data.variant;
  },

  uploadImage: async (id: string, file: File): Promise<ProductVariant> => {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await apiClient.put<{
      success: boolean;
      variant: ProductVariant;
    }>(ENDPOINTS.productVariant.uploadImage(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.variant;
  },
};
