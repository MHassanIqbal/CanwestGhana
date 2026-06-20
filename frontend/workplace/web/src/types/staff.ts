export type StaffRole = "admin" | "manager" | "employee";

export interface Staff {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: Staff;
}

export interface CreateStaffInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  role: StaffRole;
}

export interface UpdateStaffInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  role?: StaffRole;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordInput {
  password: string;
  confirmPassword: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}
