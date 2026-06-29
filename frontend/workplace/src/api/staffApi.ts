import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type {
  ChangePasswordInput,
  CreateStaffInput,
  LoginCredentials,
  LoginResponse,
  ResetPasswordInput,
  Staff,
  UpdateStaffInput,
} from "@/types/staff";

export const staffApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>(
      ENDPOINTS.staff.login,
      credentials,
    );
    return data;
  },

  getProfile: async (): Promise<Staff> => {
    const { data } = await apiClient.get<{ staff: Staff }>(ENDPOINTS.staff.me);
    return data.staff;
  },

  getAllStaff: async (): Promise<Staff[]> => {
    const { data } = await apiClient.get<{ allStaff: Staff[] }>(
      ENDPOINTS.staff.allStaff,
    );
    return data.allStaff;
  },

  deactivateStaff: async (id: string): Promise<void> => {
    await apiClient.put(ENDPOINTS.staff.deactivate(id));
  },

  reactivateStaff: async (id: string): Promise<void> => {
    await apiClient.put(ENDPOINTS.staff.reactivate(id));
  },

  createStaff: async (input: CreateStaffInput): Promise<Staff> => {
    const { data } = await apiClient.post<{ success: boolean; staff: Staff }>(
      ENDPOINTS.staff.createStaff,
      input,
    );
    return data.staff;
  },

  updateStaff: async (id: string, input: UpdateStaffInput): Promise<Staff> => {
    const { data } = await apiClient.put<{ success: boolean; staff: Staff }>(
      ENDPOINTS.staff.update(id),
      input,
    );
    return data.staff;
  },

  changePassword: async (input: ChangePasswordInput): Promise<void> => {
    await apiClient.put(ENDPOINTS.staff.changePassword, input);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post(ENDPOINTS.staff.forgotPassword, { email });
  },

  resetPassword: async (
    token: string,
    input: ResetPasswordInput,
  ): Promise<void> => {
    await apiClient.put(ENDPOINTS.staff.resetPassword(token), input);
  },

  validateResetToken: async (token: string): Promise<void> => {
    await apiClient.get(ENDPOINTS.staff.validateResetToken(token));
  },

  deleteStaff: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.staff.delete(id));
  },

  logout: async (): Promise<void> => {
    await apiClient.post(ENDPOINTS.staff.logout);
  },
};
