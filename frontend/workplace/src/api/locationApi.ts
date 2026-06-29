import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type {
  Location,
  CreateLocationInput,
  UpdateLocationInput,
} from "@/types/location";

export const locationApi = {
  getAllLocations: async (): Promise<Location[]> => {
    const { data } = await apiClient.get<{ locations: Location[] }>(
      ENDPOINTS.location.getAll,
    );
    return data.locations;
  },

  getLocationById: async (id: string): Promise<Location> => {
    const { data } = await apiClient.get<{ location: Location }>(
      ENDPOINTS.location.getById(id),
    );
    return data.location;
  },

  createLocation: async (input: CreateLocationInput): Promise<Location> => {
    const { data } = await apiClient.post<{
      success: boolean;
      location: Location;
    }>(ENDPOINTS.location.create, input);
    return data.location;
  },

  updateLocation: async (
    id: string,
    input: UpdateLocationInput,
  ): Promise<Location> => {
    const { data } = await apiClient.put<{
      success: boolean;
      location: Location;
    }>(ENDPOINTS.location.update(id), input);
    return data.location;
  },

  deleteLocation: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.location.delete(id));
  },
};
