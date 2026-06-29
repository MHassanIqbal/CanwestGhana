import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type { PriceListResponse } from "@/types/priceList";

export const priceListApi = {
  getPriceList: async (query?: string): Promise<PriceListResponse> => {
    const { data } = await apiClient.get<PriceListResponse>(
      ENDPOINTS.priceList.getAll,
      { params: query ? { q: query } : undefined },
    );
    return data;
  },
};
