import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../types/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        if (error instanceof ApiError) {
          if (error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }
        }
        return true;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  stores: {
    all: ["stores"] as const,
    detail: (storeId: string) => ["stores", storeId] as const,
  },
  staff: {
    all: ["staff"] as const,
  },
  categories: {
    all: (tree: boolean) => ["categories", { tree }] as const,
  },
  products: {
    all: (storeId: string, params: any) => ["products", storeId, params] as const,
    detail: (productId: string) => ["products", "detail", productId] as const,
    lowStock: (storeId: string) => ["products", "lowStock", storeId] as const,
  },
  orders: {
    live: (storeId: string) => ["orders", "live", storeId] as const,
    all: (storeId: string, params: any) => ["orders", storeId, params] as const,
    detail: (orderId: string) => ["orders", "detail", orderId] as const,
  },
  customers: {
    all: (params: any) => ["customers", params] as const,
    detail: (userId: string) => ["customers", "detail", userId] as const,
  },
  coupons: {
    all: (storeId: string) => ["coupons", storeId] as const,
    detail: (couponId: string) => ["coupons", "detail", couponId] as const,
    usage: (couponId: string) => ["coupons", "usage", couponId] as const,
  },
  dashboard: {
    analytics: (storeId: string, params: any) => ["dashboard", storeId, params] as const,
    salesReport: (storeId: string, params: any) => ["reports", "sales", storeId, params] as const,
    topProducts: (storeId: string, limit?: number) => ["reports", "topProducts", storeId, limit] as const,
    categorySales: (storeId: string) => ["reports", "categorySales", storeId] as const,
  },
};
