import { apiClient } from "./client";
import { PaginatedResult, ResponseModel } from "../types/api";
import { ICustomerBrief, ICustomerDetail } from "../types/domain";

export const customerApi = {
  list: async (q?: string) => {
    const res = await apiClient.get<ResponseModel<{ items: ICustomerBrief[]; pagination: any }>>("/customers", {
      params: { q },
    });
    return res.data.data || { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false } };
  },

  getById: async (userId: string) => {
    const res = await apiClient.get<ResponseModel<ICustomerDetail>>(
      `/customers/${userId}`
    );
    return res.data.data;
  },

  getCustomers: async (params: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ICustomerBrief>> => {
    const res = await apiClient.get<ResponseModel<PaginatedResult<ICustomerBrief>>>(
      "/customers",
      { params }
    );
    return res.data.data || { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false } };
  },

  getCustomer: async (userId: string): Promise<ICustomerDetail> => {
    const res = await apiClient.get<ResponseModel<ICustomerDetail>>(
      `/customers/${userId}`
    );
    return res.data.data!;
  },
};

export const customerService = customerApi;
