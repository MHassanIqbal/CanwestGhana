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

  brand: {
    getAll: "/brand",
    getById: (id: string) => `/brand/${id}`,
    create: "/brand",
    update: (id: string) => `/brand/${id}`,
    delete: (id: string) => `/brand/${id}`,
    uploadLogo: (id: string) => `/brand/${id}/logo`,
  },

  category: {
    getAll: "/category",
    getById: (id: string) => `/category/${id}`,
    create: "/category",
    update: (id: string) => `/category/${id}`,
    delete: (id: string) => `/category/${id}`,
    uploadImage: (id: string) => `/category/${id}/image`,
  },

  location: {
    getAll: "/location",
    getById: (id: string) => `/location/${id}`,
    create: "/location",
    update: (id: string) => `/location/${id}`,
    delete: (id: string) => `/location/${id}`,
  },

  product: {
    getAll: "/product",
    searchOptions: "/product/search-options",
    getById: (id: string) => `/product/${id}`,
    create: "/product",
    update: (id: string) => `/product/${id}`,
    delete: (id: string) => `/product/${id}`,
    addImage: (id: string) => `/product/${id}/image`,
    removeImage: (id: string) => `/product/${id}/image`,
  },

  productVariant: {
    getAll: "/product-variant",
    getById: (id: string) => `/product-variant/${id}`,
    create: "/product-variant",
    update: (id: string) => `/product-variant/${id}`,
    delete: (id: string) => `/product-variant/${id}`,
    adjustStock: (id: string) => `/product-variant/${id}/stock`,
    uploadImage: (id: string) => `/product-variant/${id}/image`,
  },

  priceList: {
    getAll: "/price-list",
  },

  proforma: {
    getAll: "/proforma",
    getById: (id: string) => `/proforma/${id}`,
    create: "/proforma",
    update: (id: string) => `/proforma/${id}`,
    delete: (id: string) => `/proforma/${id}`,
    duplicate: (id: string) => `/proforma/${id}/duplicate`,
    pdf: (id: string) => `/proforma/${id}/pdf`,
    verify: (token: string) => `/proforma/verify/${token}`,
  },

  customer: {
    getAll: "/customer",
    getById: (id: string) => `/customer/${id}`,
    create: "/customer",
    update: (id: string) => `/customer/${id}`,
    delete: (id: string) => `/customer/${id}`,
  },
} as const;
