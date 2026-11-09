import { apiClient } from "./client";
import { ResponseModel } from "../types/api";
import { IStore } from "../types/domain";

export const storeApi = {
  getStores: async () => {
    const res = await apiClient.get<ResponseModel<IStore[]>>("/stores");
    return res.data;
  },

  getStore: async (storeId: string) => {
    const res = await apiClient.get<ResponseModel<IStore>>(`/stores/${storeId}`);
    return res.data;
  },

  updateSettings: async (storeId: string, data: Partial<IStore>) => {
    const res = await apiClient.patch<ResponseModel<IStore>>(`/stores/${storeId}`, data);
    return res.data;
  },

  updateStore: async (storeId: string, data: Partial<IStore>) => {
    const res = await apiClient.patch<ResponseModel<IStore>>(`/stores/${storeId}`, data);
    return res.data;
  },

  setAcceptingOrders: async (
    storeId: string,
    payload: { isAcceptingOrders: boolean; reason?: string } | boolean,
    reason?: string
  ) => {
    const body =
      typeof payload === "boolean"
        ? { isAcceptingOrders: payload, reason }
        : payload;
    const res = await apiClient.patch<ResponseModel<IStore>>(
      `/stores/${storeId}/accepting`,
      body
    );
    return res.data;
  },
};

export const storeService = storeApi;
