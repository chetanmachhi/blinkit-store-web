import { apiClient } from "./client";
import { PaginatedResult, ResponseModel } from "../types/api";
import { IProduct } from "../types/domain";

export interface IBulkImportRow {
  name: string;
  categorySlug: string;
  brand?: string;
  unit: string;
  mrp: number;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
}

export interface IBulkImportResult {
  row: number;
  status: "created" | "updated" | "error";
  message: string;
}

export const productApi = {
  list: async (
    _storeId: string,
    params: {
      q?: string;
      categoryId?: string;
      brand?: string;
      isAvailable?: boolean;
      includeDeleted?: boolean;
      lowStock?: boolean;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const res = await apiClient.get<ResponseModel<PaginatedResult<IProduct>>>(
      "/products",
      { params }
    );
    return res.data;
  },

  get: async (productId: string) => {
    const res = await apiClient.get<ResponseModel<IProduct>>(`/products/${productId}`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await apiClient.post<ResponseModel<IProduct>>("/products", data);
    return res.data;
  },

  update: async (productId: string, data: any) => {
    const res = await apiClient.patch<ResponseModel<IProduct>>(
      `/products/${productId}`,
      data
    );
    return res.data;
  },

  quickUpdate: async (
    productId: string,
    data: { price?: number; mrp?: number; stock?: number; isAvailable?: boolean }
  ) => {
    const res = await apiClient.patch<ResponseModel<IProduct>>(
      `/products/${productId}/quick`,
      data
    );
    return res.data;
  },

  updateStock: async (
    productId: string,
    data: { stock?: number; delta?: number }
  ) => {
    const res = await apiClient.patch<ResponseModel<IProduct>>(
      `/products/${productId}/stock`,
      data
    );
    return res.data;
  },

  delete: async (productId: string) => {
    const res = await apiClient.delete<ResponseModel<void>>(`/products/${productId}`);
    return res.data;
  },

  restore: async (productId: string) => {
    const res = await apiClient.post<ResponseModel<IProduct>>(
      `/products/${productId}/restore`
    );
    return res.data;
  },

  getLowStock: async () => {
    const res = await apiClient.get<ResponseModel<IProduct[]>>("/products/low-stock");
    return res.data;
  },

  export: async (_storeId?: string) => {
    const res = await apiClient.get<ResponseModel<IProduct[]>>("/products/export");
    return res.data;
  },

  bulkImport: async (
    _storeId: string,
    payload: { dryRun: boolean; rows: IBulkImportRow[] }
  ) => {
    const res = await apiClient.post<ResponseModel<{ results: IBulkImportResult[] }>>(
      "/products/bulk-import",
      payload
    );
    return res.data;
  },
};

export const productService = {
  async getProducts(params: {
    q?: string;
    categoryId?: string;
    brand?: string;
    isAvailable?: boolean;
    includeDeleted?: boolean;
    lowStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<IProduct>> {
    const res = await apiClient.get<ResponseModel<PaginatedResult<IProduct>>>(
      "/products",
      { params }
    );
    return res.data.data || { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false } };
  },

  async getProduct(productId: string): Promise<IProduct> {
    const res = await apiClient.get<ResponseModel<IProduct>>(`/products/${productId}`);
    return res.data.data!;
  },

  async createProduct(data: any): Promise<IProduct> {
    const res = await apiClient.post<ResponseModel<IProduct>>("/products", data);
    return res.data.data!;
  },

  async updateProduct(productId: string, data: any): Promise<IProduct> {
    const res = await apiClient.patch<ResponseModel<IProduct>>(
      `/products/${productId}`,
      data
    );
    return res.data.data!;
  },

  async quickUpdate(
    productId: string,
    data: { price?: number; mrp?: number; stock?: number; isAvailable?: boolean }
  ): Promise<IProduct> {
    const res = await apiClient.patch<ResponseModel<IProduct>>(
      `/products/${productId}/quick`,
      data
    );
    return res.data.data!;
  },

  async updateStock(
    productId: string,
    data: { stock?: number; delta?: number }
  ): Promise<IProduct> {
    const res = await apiClient.patch<ResponseModel<IProduct>>(
      `/products/${productId}/stock`,
      data
    );
    return res.data.data!;
  },

  async deleteProduct(productId: string): Promise<void> {
    await apiClient.delete(`/products/${productId}`);
  },

  async restoreProduct(productId: string): Promise<IProduct> {
    const res = await apiClient.post<ResponseModel<IProduct>>(
      `/products/${productId}/restore`
    );
    return res.data.data!;
  },

  async getLowStockProducts(): Promise<IProduct[]> {
    const res = await apiClient.get<ResponseModel<IProduct[]>>("/products/low-stock");
    return res.data.data || [];
  },

  async exportProducts(): Promise<any[]> {
    const res = await apiClient.get<ResponseModel<any[]>>("/products/export");
    return res.data.data || [];
  },

  async bulkImport(payload: { dryRun: boolean; rows: any[] }): Promise<any> {
    const res = await apiClient.post<ResponseModel<any>>(
      "/products/bulk-import",
      payload
    );
    return res.data.data;
  },
};
