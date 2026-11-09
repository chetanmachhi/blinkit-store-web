import { create } from "zustand";
import { IAuthMeResponse, IStoreBrief, StoreRole, Role } from "../types/domain";

const REFRESH_TOKEN_KEY = "store_refresh_token";
const ACTIVE_STORE_KEY = "store_active_id";

const authChannel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("store_auth_channel")
    : null;

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  );
};

export const setStoredRefreshToken = (
  token: string | null,
  persistToLocalStorage: boolean = false
): void => {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } else if (persistToLocalStorage) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export interface AuthState {
  accessToken: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: Role;
  } | null;
  storeRole: StoreRole | null;
  permissions: string[];
  stores: IStoreBrief[];
  activeStoreId: string | null;
  demoToolsEnabled: boolean;
  isInitializing: boolean;
  setAuth: (payload: {
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
    refreshToken?: string;
    rememberMe?: boolean;
    demoToolsEnabled?: boolean;
  }) => void;
  setAuthData: (
    accessToken: string,
    authMe: IAuthMeResponse,
    rememberMe?: boolean
  ) => void;
  setAccessToken: (token: string | null) => void;
  setActiveStoreId: (storeId: string) => void;
  clearAuth: () => void;
  setInitializing: (val: boolean) => void;
  updateStoreAcceptingStatus: (isAccepting: boolean, reason?: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  if (authChannel) {
    authChannel.onmessage = (event) => {
      if (event.data?.type === "LOGOUT") {
        set({
          accessToken: null,
          user: null,
          storeRole: null,
          permissions: [],
          stores: [],
          activeStoreId: null,
        });
      } else if (event.data?.type === "TOKEN_REFRESHED" && event.data.accessToken) {
        set({ accessToken: event.data.accessToken });
      }
    };
  }

  const initialStoreId =
    typeof window !== "undefined"
      ? localStorage.getItem(ACTIVE_STORE_KEY)
      : null;

  return {
    accessToken: null,
    user: null,
    storeRole: null,
    permissions: [],
    stores: [],
    activeStoreId: initialStoreId,
    demoToolsEnabled: false,
    isInitializing: true,

    setAuth: (payload) => {
      if (payload.refreshToken) {
        setStoredRefreshToken(payload.refreshToken, Boolean(payload.rememberMe));
      }

      const storesList = payload.stores || [];
      const activeId =
        get().activeStoreId &&
        storesList.some((s) => s.id === get().activeStoreId)
          ? get().activeStoreId!
          : storesList[0]?.id || "";

      if (typeof window !== "undefined" && activeId) {
        localStorage.setItem(ACTIVE_STORE_KEY, activeId);
      }

      set({
        accessToken: payload.accessToken,
        user: payload.user,
        storeRole: payload.storeRole,
        permissions: payload.permissions || [],
        stores: storesList,
        activeStoreId: activeId,
        demoToolsEnabled: payload.demoToolsEnabled ?? true,
        isInitializing: false,
      });

      if (authChannel) {
        authChannel.postMessage({
          type: "TOKEN_REFRESHED",
          accessToken: payload.accessToken,
        });
      }
    },

    setAuthData: (accessToken, authMe, rememberMe) => {
      const activeId =
        get().activeStoreId &&
        authMe.stores.some((s) => s.id === get().activeStoreId)
          ? get().activeStoreId!
          : authMe.stores[0]?.id || "";

      if (typeof window !== "undefined" && activeId) {
        localStorage.setItem(ACTIVE_STORE_KEY, activeId);
      }

      set({
        accessToken,
        user: authMe.user,
        storeRole: authMe.storeRole,
        permissions: authMe.permissions,
        stores: authMe.stores,
        activeStoreId: activeId,
        demoToolsEnabled: authMe.demoToolsEnabled,
        isInitializing: false,
      });

      if (authChannel) {
        authChannel.postMessage({
          type: "TOKEN_REFRESHED",
          accessToken,
        });
      }
    },

    setAccessToken: (token) => {
      set({ accessToken: token });
      if (authChannel && token) {
        authChannel.postMessage({
          type: "TOKEN_REFRESHED",
          accessToken: token,
        });
      }
    },

    setActiveStoreId: (storeId) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_STORE_KEY, storeId);
      }
      set({ activeStoreId: storeId });
    },

    clearAuth: () => {
      setStoredRefreshToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACTIVE_STORE_KEY);
      }
      set({
        accessToken: null,
        user: null,
        storeRole: null,
        permissions: [],
        stores: [],
        activeStoreId: null,
        isInitializing: false,
      });

      if (authChannel) {
        authChannel.postMessage({ type: "LOGOUT" });
      }
    },

    setInitializing: (val) => set({ isInitializing: val }),

    updateStoreAcceptingStatus: (isAccepting, _reason) => {
      const currentActiveId = get().activeStoreId;
      set((state) => ({
        stores: state.stores.map((s) =>
          s.id === currentActiveId
            ? { ...s, isAcceptingOrders: isAccepting }
            : s
        ),
      }));
    },
  };
});

export const useCan = (permission: string): boolean => {
  const permissions = useAuthStore((state: AuthState) => state.permissions);
  return permissions.includes(permission);
};
