import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type { Company, UpdateCompanyInput } from "@/types/company";

export const companyApi = {
  getCompany: async (): Promise<Company> => {
    const { data } = await apiClient.get<{ company: Company }>(
      ENDPOINTS.company.get,
    );
    return data.company;
  },

  updateCompany: async (input: UpdateCompanyInput): Promise<Company> => {
    const { data } = await apiClient.put<{
      success: boolean;
      company: Company;
    }>(ENDPOINTS.company.update, input);
    return data.company;
  },

  uploadLogo: async (file: File): Promise<Company> => {
    const formData = new FormData();
    formData.append("logo", file);

    const { data } = await apiClient.put<{
      success: boolean;
      company: Company;
    }>(ENDPOINTS.company.uploadLogo, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.company;
  },
};
