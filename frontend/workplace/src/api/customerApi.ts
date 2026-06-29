import apiClient from "@/connection/apiClient";
import { ENDPOINTS } from "@/connection/endpoints";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/types/customer";

export const customerApi = {
  getAllCustomers: async (): Promise<Customer[]> => {
    const { data } = await apiClient.get<{ customers: Customer[] }>(
      ENDPOINTS.customer.getAll,
    );
    return data.customers;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get<{ customer: Customer }>(
      ENDPOINTS.customer.getById(id),
    );
    return data.customer;
  },

  createCustomer: async (input: CreateCustomerInput): Promise<Customer> => {
    const { data } = await apiClient.post<{
      success: boolean;
      customer: Customer;
    }>(ENDPOINTS.customer.create, input);
    return data.customer;
  },

  updateCustomer: async (
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> => {
    const { data } = await apiClient.put<{
      success: boolean;
      customer: Customer;
    }>(ENDPOINTS.customer.update(id), input);
    return data.customer;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.customer.delete(id));
  },
};
