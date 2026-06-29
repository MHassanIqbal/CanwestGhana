import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/category";

export const categoryApi = {
  getAllCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<{ categories: Category[] }>(
      ENDPOINTS.category.getAll,
    );
    return data.categories;
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get<{ category: Category }>(
      ENDPOINTS.category.getById(id),
    );
    return data.category;
  },

  createCategory: async (input: CreateCategoryInput): Promise<Category> => {
    const { data } = await apiClient.post<{
      success: boolean;
      category: Category;
    }>(ENDPOINTS.category.create, input);
    return data.category;
  },

  updateCategory: async (
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category> => {
    const { data } = await apiClient.put<{
      success: boolean;
      category: Category;
    }>(ENDPOINTS.category.update(id), input);
    return data.category;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.category.delete(id));
  },

  uploadImage: async (id: string, file: File): Promise<Category> => {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await apiClient.put<{
      success: boolean;
      category: Category;
    }>(ENDPOINTS.category.uploadImage(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.category;
  },
};
