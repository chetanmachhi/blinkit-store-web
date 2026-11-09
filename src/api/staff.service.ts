import { apiClient } from "./client";
import { ResponseModel } from "../types/api";
import { StoreRole } from "../types/domain";

export interface IStaffUser {
  id: string;
  name: string;
  email: string;
  storeRole: StoreRole;
  storeIds: string[];
  isActive: boolean;
  createdAt?: string;
}

/**
 * The API returns raw user documents (`_id`, and no `storeRole` for platform admins).
 * Normalise once here so screens can rely on `id` and `storeRole`.
 */
const normalizeStaff = (u: any): IStaffUser => ({
  ...u,
  id: u.id ?? u._id,
  storeRole: u.storeRole ?? "staff",
  storeIds: (u.storeIds || []).map((x: any) => String(x)),
});

export const staffApi = {
  list: async () => {
    const res = await apiClient.get<ResponseModel<IStaffUser[]>>("/staff");
    return { ...res.data, data: (res.data.data || []).map(normalizeStaff) };
  },

  getStaff: async (): Promise<IStaffUser[]> => {
    const res = await apiClient.get<ResponseModel<IStaffUser[]>>("/staff");
    return (res.data.data || []).map(normalizeStaff);
  },

  create: async (payload: {
    name: string;
    email: string;
    password: string;
    storeRole: StoreRole;
    storeIds: string[];
  }) => {
    const res = await apiClient.post<ResponseModel<IStaffUser>>("/staff", payload);
    return res.data;
  },

  createStaff: async (payload: {
    name: string;
    email: string;
    password: string;
    storeRole: string;
    storeIds: string[];
  }): Promise<any> => {
    const res = await apiClient.post<ResponseModel<any>>("/staff", payload);
    return res.data.data;
  },

  update: async (
    userId: string,
    payload: {
      name?: string;
      storeRole?: StoreRole;
      storeIds?: string[];
      isActive?: boolean;
    }
  ) => {
    const res = await apiClient.patch<ResponseModel<IStaffUser>>(
      `/staff/${userId}`,
      payload
    );
    return res.data;
  },

  updateStaff: async (
    userId: string,
    payload: {
      name?: string;
      storeRole?: string;
      storeIds?: string[];
      isActive?: boolean;
    }
  ): Promise<any> => {
    const res = await apiClient.patch<ResponseModel<any>>(
      `/staff/${userId}`,
      payload
    );
    return res.data.data;
  },

  resetPassword: async (userId: string, newPassword: string) => {
    const res = await apiClient.post<ResponseModel<void>>(
      `/staff/${userId}/reset-password`,
      { newPassword }
    );
    return res.data;
  },
};

export const staffService = staffApi;
