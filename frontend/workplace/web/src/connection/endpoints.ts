export const ENDPOINTS = {
  staff: {
    login: "/staff/login",
    logout: "/staff/logout",
    me: "/staff/me",
    allStaff: "/staff/all-staff",
    createStaff: "/staff/create-staff",
    update: (id: string) => `/staff/${id}/update`,
    deactivate: (id: string) => `/staff/${id}/deactivate`,
    reactivate: (id: string) => `/staff/${id}/reactivate`,
    delete: (id: string) => `/staff/${id}/delete`,
    changePassword: "/staff/me/change-password",
    forgotPassword: "/staff/password/forgot",
    resetPassword: (token: string) => `/staff/password/reset/${token}`,
    validateResetToken: (token: string) =>
      `/staff/password/reset/validate/${token}`,
  },

  company: {
    get: "/company",
    update: "/company",
    uploadLogo: "/company/logo",
  },
} as const;
