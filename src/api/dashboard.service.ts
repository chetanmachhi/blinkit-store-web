import { apiClient } from "./client";
import { ResponseModel } from "../types/api";
import { IDashboardData } from "../types/domain";

export interface ISalesReportItem {
  date: string;
  ordersCount: number;
  revenue: number;
}

export interface ICategorySalesItem {
  name: string;
  revenue: number;
}

export const dashboardApi = {
  getDashboard: async (storeId?: string, range: string = "7d") => {
    const res = await apiClient.get<ResponseModel<IDashboardData>>("/dashboard", {
      params: { storeId, range },
    });
    return res.data.data;
  },

  getSalesReport: async (storeId?: string, range: string = "7d", groupBy: "day" | "hour" = "day") => {
    const res = await apiClient.get<ResponseModel<ISalesReportItem[]>>("/reports/sales", {
      params: { storeId, range, groupBy },
    });
    return res.data.data || [];
  },

  getTopProducts: async (storeId?: string, limit: number = 10) => {
    const res = await apiClient.get<ResponseModel<any[]>>("/reports/top-products", {
      params: { storeId, limit: String(limit) },
    });
    return res.data.data || [];
  },

  getCategorySales: async (storeId?: string, range: string = "7d") => {
    const res = await apiClient.get<ResponseModel<ICategorySalesItem[]>>("/reports/category-sales", {
      params: { storeId, range },
    });
    return res.data.data || [];
  },
};

export const dashboardService = {
  async getDashboard(params: {
    range?: string;
    from?: string;
    to?: string;
  }): Promise<IDashboardData> {
    const res = await apiClient.get<ResponseModel<IDashboardData>>("/dashboard", {
      params,
    });
    return res.data.data!;
  },

  async getSalesReport(params: {
    groupBy?: string;
    from?: string;
    to?: string;
  }): Promise<any[]> {
    const res = await apiClient.get<ResponseModel<any[]>>("/reports/sales", {
      params,
    });
    return res.data.data || [];
  },

  async getTopProducts(limit: number = 10): Promise<any[]> {
    const res = await apiClient.get<ResponseModel<any[]>>("/reports/top-products", {
      params: { limit: String(limit) },
    });
    return res.data.data || [];
  },

  async getCategorySales(): Promise<any[]> {
    const res = await apiClient.get<ResponseModel<any[]>>("/reports/category-sales");
    return res.data.data || [];
  },
};
