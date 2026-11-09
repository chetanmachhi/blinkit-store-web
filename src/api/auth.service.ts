import { apiClient } from "./client";
import { ResponseModel } from "../types/api";
import { IAuthMeResponse, IStoreBrief, StoreRole, Role } from "../types/domain";

export interface ILoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: Role;
  };
  storeRole: StoreRole;
  permissions: string[];
  stores: IStoreBrief[];
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (payload: { email: string; password: string }) => {
    const res = await apiClient.post<ResponseModel<ILoginResponse>>("/auth/login", payload);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<ResponseModel<IAuthMeResponse>>("/auth/me");
    return res.data;
  },

  logout: async (refreshToken?: string) => {
    const res = await apiClient.post<ResponseModel<void>>("/auth/logout", { refreshToken });
    return res.data;
  },

  logoutAll: async () => {
    const res = await apiClient.post<ResponseModel<void>>("/auth/logout-all");
    return res.data;
  },

  changePassword: async (payload: {
    currentPassword?: string;
    oldPassword?: string;
    newPassword: string;
  }) => {
    const res = await apiClient.patch<ResponseModel<void>>("/auth/password", {
      currentPassword: payload.currentPassword || payload.oldPassword,
      newPassword: payload.newPassword,
    });
    return res.data;
  },

  pingHealth: async (timeoutMs: number = 20000): Promise<boolean> => {
    try {
      const res = await apiClient.get("/health", { timeout: timeoutMs });
      return res.status === 200;
    } catch {
      return false;
    }
  },
};

export const authService = authApi;
