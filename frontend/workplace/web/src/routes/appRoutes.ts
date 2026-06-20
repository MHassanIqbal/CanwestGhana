export const APP_ROUTES = {
  login: "/login",
  staff: "/staff",
  staffNew: "/staff/new",
  staffDetail: (id: string) => `/staff/${id}`,
  profile: "/profile",
  forgotPassword: "/forgot-password",
  resetPassword: (token: string) => `/reset-password/${token}`,
  resetPasswordPattern: "/reset-password/:token",
} as const;
