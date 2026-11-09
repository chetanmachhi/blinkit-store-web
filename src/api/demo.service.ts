import { apiClient } from "./client";
import { ResponseModel } from "../types/api";

export const demoApi = {
  createOrders: async (count: number = 1) => {
    const res = await apiClient.post<ResponseModel<any[]>>("/demo/orders", {
      count,
    });
    return res.data;
  },

  createDemoOrders: async (count: number = 1): Promise<any[]> => {
    const res = await apiClient.post<ResponseModel<any[]>>("/demo/orders", {
      count,
    });
    return res.data.data || [];
  },

  reset: async () => {
    const res = await apiClient.post<ResponseModel<{ deletedCount: number }>>(
      "/demo/reset"
    );
    return res.data;
  },

  resetDemoOrders: async (): Promise<{ deletedCount: number }> => {
    const res = await apiClient.post<ResponseModel<{ deletedCount: number }>>(
      "/demo/reset"
    );
    return res.data.data!;
  },
};

export const demoService = demoApi;
