import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type { ProductSearchOption } from "@/types/product";
import type {
  Proforma,
  CreateProformaInput,
  UpdateProformaInput,
  ProformaVerificationResult,
} from "@/types/proforma";

export const proformaApi = {
  getAllProformas: async (): Promise<Proforma[]> => {
    const { data } = await apiClient.get<{ proformas: Proforma[] }>(
      ENDPOINTS.proforma.getAll,
    );
    return data.proformas;
  },

  getProformaById: async (id: string): Promise<Proforma> => {
    const { data } = await apiClient.get<{ proforma: Proforma }>(
      ENDPOINTS.proforma.getById(id),
    );
    return data.proforma;
  },

  createProforma: async (input: CreateProformaInput): Promise<Proforma> => {
    const { data } = await apiClient.post<{
      success: boolean;
      proforma: Proforma;
    }>(ENDPOINTS.proforma.create, input);
    return data.proforma;
  },

  updateProforma: async (
    id: string,
    input: UpdateProformaInput,
  ): Promise<Proforma> => {
    const { data } = await apiClient.put<{
      success: boolean;
      proforma: Proforma;
    }>(ENDPOINTS.proforma.update(id), input);
    return data.proforma;
  },

  deleteProforma: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.proforma.delete(id));
  },

  duplicateProforma: async (id: string): Promise<Proforma> => {
    const { data } = await apiClient.post<{
      success: boolean;
      proforma: Proforma;
    }>(ENDPOINTS.proforma.duplicate(id));
    return data.proforma;
  },

  downloadPdf: async (id: string, proformaNumber: string): Promise<void> => {
    const response = await apiClient.get(ENDPOINTS.proforma.pdf(id), {
      responseType: "blob",
    });
    const url = URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${proformaNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Staff-only — returns a summary for visual comparison, not the full record
  verifyProforma: async (
    token: string,
  ): Promise<ProformaVerificationResult> => {
    const { data } = await apiClient.get<ProformaVerificationResult>(
      ENDPOINTS.proforma.verify(token),
    );
    return data;
  },

  getSearchOptions: async (query?: string): Promise<ProductSearchOption[]> => {
    const { data } = await apiClient.get<{ options: ProductSearchOption[] }>(
      ENDPOINTS.product.searchOptions,
      { params: query ? { q: query } : undefined },
    );
    return data.options;
  },
};
