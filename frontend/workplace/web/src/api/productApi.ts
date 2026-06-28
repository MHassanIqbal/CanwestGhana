import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductSearchOption,
} from "@/types/product";

export const productApi = {
  getAllProducts: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<{ products: Product[] }>(
      ENDPOINTS.product.getAll,
    );
    return data.products;
  },

  getSearchOptions: async (): Promise<ProductSearchOption[]> => {
    const { data } = await apiClient.get<{ options: ProductSearchOption[] }>(
      ENDPOINTS.product.searchOptions,
    );
    return data.options;
  },

  getProductById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<{ product: Product }>(
      ENDPOINTS.product.getById(id),
    );
    return data.product;
  },

  createProduct: async (input: CreateProductInput): Promise<Product> => {
    const { data } = await apiClient.post<{
      success: boolean;
      product: Product;
    }>(ENDPOINTS.product.create, input);
    return data.product;
  },

  updateProduct: async (
    id: string,
    input: UpdateProductInput,
  ): Promise<Product> => {
    const { data } = await apiClient.put<{
      success: boolean;
      product: Product;
    }>(ENDPOINTS.product.update(id), input);
    return data.product;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.product.delete(id));
  },

  addImage: async (id: string, file: File): Promise<Product> => {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await apiClient.post<{
      success: boolean;
      product: Product;
    }>(ENDPOINTS.product.addImage(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.product;
  },

  removeImage: async (id: string, imageUrl: string): Promise<Product> => {
    const { data } = await apiClient.delete<{
      success: boolean;
      product: Product;
    }>(ENDPOINTS.product.removeImage(id), { data: { imageUrl } });
    return data.product;
  },
};
