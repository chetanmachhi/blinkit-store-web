import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "../env";
import { ApiError, ResponseModel } from "../types/api";
import {
  useAuthStore,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from "../store/authStore";

export const toastListeners: ((msg: string, type: "success" | "error" | "info") => void)[] = [];

export const emitToast = (msg: string, type: "success" | "error" | "info" = "info") => {
  toastListeners.forEach((fn) => fn(msg, type));
};

export const subscribeToast = (fn: (msg: string, type: "success" | "error" | "info") => void) => {
  toastListeners.push(fn);
  return () => {
    const idx = toastListeners.indexOf(fn);
    if (idx !== -1) toastListeners.splice(idx, 1);
  };
};

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken, activeStoreId } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (activeStoreId) {
      config.headers["x-store-id"] = activeStoreId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let inFlightRefreshPromise: Promise<string | null> | null = null;

const performSingleFlightRefresh = async (): Promise<string | null> => {
  const currentToken = getStoredRefreshToken();
  if (!currentToken) return null;

  const runRefreshCall = async (): Promise<string | null> => {
    const tokenToUse = getStoredRefreshToken();
    if (!tokenToUse) return null;

    try {
      const resp = await axios.post<
        ResponseModel<{ accessToken: string; refreshToken: string }>
      >(
        `${env.VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken: tokenToUse },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = resp.data?.data;
      if (data?.accessToken && data?.refreshToken) {
        const isLocalStorage =
          typeof window !== "undefined" &&
          localStorage.getItem("store_refresh_token") !== null;
        setStoredRefreshToken(data.refreshToken, isLocalStorage);
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch (err) {
      useAuthStore.getState().clearAuth();
      return null;
    }
  };

  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return (navigator as any).locks.request(
      "store_auth_refresh_lock",
      async () => {
        return runRefreshCall();
      }
    );
  }

  return runRefreshCall();
};

apiClient.interceptors.response.use(
  (response) => {
    const envelope = response.data as ResponseModel;
    if (
      envelope &&
      typeof envelope.statusCode === "number" &&
      envelope.statusCode >= 400
    ) {
      if (envelope.showMessage && envelope.message) {
        emitToast(envelope.message, "error");
      }
      throw new ApiError(
        envelope.message || "Request failed",
        envelope.statusCode,
        envelope.showMessage !== false,
        envelope.data
      );
    }

    if (
      envelope?.showMessage &&
      envelope?.message &&
      response.config.method &&
      ["post", "patch", "put", "delete"].includes(response.config.method.toLowerCase())
    ) {
      emitToast(envelope.message, "success");
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      if (!inFlightRefreshPromise) {
        inFlightRefreshPromise = performSingleFlightRefresh().finally(() => {
          inFlightRefreshPromise = null;
        });
      }

      const newAccessToken = await inFlightRefreshPromise;
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }
    }

    const responseData = error.response?.data as ResponseModel | undefined;
    const statusCode = error.response?.status || 500;
    const message =
      responseData?.message ||
      error.message ||
      "An unexpected network error occurred";
    const showMessage = responseData?.showMessage ?? true;

    if (showMessage && message && !originalRequest?.url?.includes("/health")) {
      emitToast(message, "error");
    }

    throw new ApiError(message, statusCode, showMessage, responseData?.data);
  }
);
