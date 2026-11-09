import { apiClient } from "./client";
import { ResponseModel } from "../types/api";
import { ICategory } from "../types/domain";

export const categoryApi = {
  list: async (asTree: boolean = false) => {
    const res = await apiClient.get<ResponseModel<ICategory[]>>("/categories", {
      params: { tree: asTree ? "true" : "false" },
    });
    return res.data;
  },

  getCategories: async (asTree: boolean = false): Promise<ICategory[]> => {
    const res = await apiClient.get<ResponseModel<ICategory[]>>("/categories", {
      params: { tree: asTree ? "true" : "false" },
    });
    return res.data.data || [];
  },

  create: async (data: Partial<ICategory>) => {
    const res = await apiClient.post<ResponseModel<ICategory>>("/categories", data);
    return res.data;
  },

  createCategory: async (data: Partial<ICategory>): Promise<ICategory> => {
    const res = await apiClient.post<ResponseModel<ICategory>>("/categories", data);
    return res.data.data!;
  },

  update: async (categoryId: string, data: Partial<ICategory>) => {
    const res = await apiClient.patch<ResponseModel<ICategory>>(
      `/categories/${categoryId}`,
      data
    );
    return res.data;
  },

  updateCategory: async (
    categoryId: string,
    data: Partial<ICategory>
  ): Promise<ICategory> => {
    const res = await apiClient.patch<ResponseModel<ICategory>>(
      `/categories/${categoryId}`,
      data
    );
    return res.data.data!;
  },

  delete: async (categoryId: string) => {
    const res = await apiClient.delete<ResponseModel<void>>(`/categories/${categoryId}`);
    return res.data;
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    await apiClient.delete(`/categories/${categoryId}`);
  },

  reorder: async (items: { id: string; sortOrder: number }[]) => {
    const res = await apiClient.patch<ResponseModel<void>>("/categories/reorder", items);
    return res.data;
  },

  reorderCategories: async (
    items: { id: string; sortOrder: number }[]
  ): Promise<void> => {
    await apiClient.patch("/categories/reorder", items);
  },
};

export const categoryService = categoryApi;
