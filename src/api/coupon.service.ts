import { apiClient } from "./client";
import { ResponseModel } from "../types/api";
import { ICoupon } from "../types/domain";

/** An order that redeemed the coupon (subset of the order document) */
export interface ICouponUsageOrder {
  _id: string;
  orderNumber: string;
  customer: { name: string; phone: string };
  bill: { discount: number; grandTotal: number };
  totalAmount: number;
  status: string;
  createdAt: string;
}

/** Shape returned by GET /coupons/:id/usage */
export interface ICouponUsageResponse {
  coupon?: ICoupon;
  /** Counter stored on the coupon */
  usageCount: number;
  /** Orders that used the coupon (source of truth) */
  totalOrders: number;
  /** Paise */
  totalDiscountGiven: number;
  recentOrders: ICouponUsageOrder[];
}

export const couponApi = {
  list: async () => {
    const res = await apiClient.get<ResponseModel<ICoupon[]>>("/coupons");
    return res.data;
  },

  getCoupons: async (): Promise<ICoupon[]> => {
    const res = await apiClient.get<ResponseModel<ICoupon[]>>("/coupons");
    return res.data.data || [];
  },

  get: async (couponId: string) => {
    const res = await apiClient.get<ResponseModel<ICoupon>>(`/coupons/${couponId}`);
    return res.data;
  },

  getCoupon: async (couponId: string): Promise<ICoupon> => {
    const res = await apiClient.get<ResponseModel<ICoupon>>(`/coupons/${couponId}`);
    return res.data.data!;
  },

  create: async (data: any) => {
    const res = await apiClient.post<ResponseModel<ICoupon>>("/coupons", data);
    return res.data;
  },

  createCoupon: async (data: any): Promise<ICoupon> => {
    const res = await apiClient.post<ResponseModel<ICoupon>>("/coupons", data);
    return res.data.data!;
  },

  update: async (couponId: string, data: any) => {
    const res = await apiClient.patch<ResponseModel<ICoupon>>(
      `/coupons/${couponId}`,
      data
    );
    return res.data;
  },

  updateCoupon: async (couponId: string, data: any): Promise<ICoupon> => {
    const res = await apiClient.patch<ResponseModel<ICoupon>>(
      `/coupons/${couponId}`,
      data
    );
    return res.data.data!;
  },

  delete: async (couponId: string) => {
    const res = await apiClient.delete<ResponseModel<void>>(`/coupons/${couponId}`);
    return res.data;
  },

  deleteCoupon: async (couponId: string): Promise<void> => {
    await apiClient.delete(`/coupons/${couponId}`);
  },

  getUsage: async (couponId: string) => {
    const res = await apiClient.get<ResponseModel<ICouponUsageResponse>>(
      `/coupons/${couponId}/usage`
    );
    return res.data;
  },

  getCouponUsage: async (couponId: string): Promise<ICouponUsageResponse> => {
    const res = await apiClient.get<ResponseModel<ICouponUsageResponse>>(
      `/coupons/${couponId}/usage`
    );
    return res.data.data!;
  },
};

export const couponService = couponApi;
