export const APP_ROUTES = {
  login: "/login",
  staff: "/staff",
  staffNew: "/staff/new",
  staffEdit: (id: string) => `/staff/${id}`,
  profile: "/profile",
  forgotPassword: "/forgot-password",
  resetPassword: (token: string) => `/reset-password/${token}`,
  resetPasswordPattern: "/reset-password/:token",

  company: "/company",

  brand: "/brand",
  brandNew: "/brand/new",
  brandEdit: (id: string) => `/brand/${id}`,

  category: "/category",
  categoryNew: "/category/new",
  categoryEdit: (id: string) => `/category/${id}`,

  location: "/location",
  locationNew: "/location/new",
  locationEdit: (id: string) => `/location/${id}`,
} as const;
