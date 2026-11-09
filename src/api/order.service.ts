import { apiClient } from "./client";
import { PaginatedResult, ResponseModel } from "../types/api";
import { ILiveOrdersData, IOrder, OrderStatus, PaymentStatus } from "../types/domain";

export const orderApi = {
  getLiveOrders: async (_storeId?: string) => {
    const res = await apiClient.get<ResponseModel<ILiveOrdersData>>("/orders/live");
    return res.data;
  },

  listOrders: async (
    _storeId: string,
    params: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      from?: string;
      to?: string;
      q?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const res = await apiClient.get<ResponseModel<PaginatedResult<IOrder>>>(
      "/orders",
      { params }
    );
    return res.data;
  },

  getOrder: async (orderId: string) => {
    const res = await apiClient.get<ResponseModel<IOrder>>(`/orders/${orderId}`);
    return res.data;
  },

  acceptOrder: async (orderId: string, prepMinutes?: number) => {
    const res = await apiClient.post<ResponseModel<IOrder>>(
      `/orders/${orderId}/accept`,
      { prepMinutes }
    );
    return res.data;
  },

  rejectOrder: async (orderId: string, reason: string) => {
    const res = await apiClient.post<ResponseModel<IOrder>>(
      `/orders/${orderId}/reject`,
      { reason }
    );
    return res.data;
  },

  updateStatus: async (
    orderId: string,
    payload: { status: OrderStatus; note?: string }
  ) => {
    const res = await apiClient.post<ResponseModel<IOrder>>(
      `/orders/${orderId}/status`,
      payload
    );
    return res.data;
  },

  cancelOrder: async (orderId: string, reason: string) => {
    const res = await apiClient.post<ResponseModel<IOrder>>(
      `/orders/${orderId}/cancel`,
      { reason }
    );
    return res.data;
  },

  updatePaymentStatus: async (
    orderId: string,
    paymentStatus: PaymentStatus
  ) => {
    const res = await apiClient.patch<ResponseModel<IOrder>>(
      `/orders/${orderId}/payment`,
      { paymentStatus }
    );
    return res.data;
  },

  updateInternalNote: async (orderId: string, internalNote: string) => {
    const res = await apiClient.patch<ResponseModel<IOrder>>(
      `/orders/${orderId}/note`,
      { internalNote }
    );
    return res.data;
  },
};

export const orderService = {
  async getLiveOrders(): Promise<ILiveOrdersData> {
    const res = await apiClient.get<ResponseModel<ILiveOrdersData>>("/orders/live");
    return res.data.data!;
  },

  async getOrders(params: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<IOrder>> {
    const res = await apiClient.get<ResponseModel<PaginatedResult<IOrder>>>(
      "/orders",
      { params }
    );
    return res.data.data || { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false } };
  },

  async getOrder(orderId: string): Promise<IOrder> {
    const res = await apiClient.get<ResponseModel<IOrder>>(`/orders/${orderId}`);
    return res.data.data!;
  },

  async acceptOrder(orderId: string, prepMinutes?: number): Promise<IOrder> {
    const res = await apiClient.post<ResponseModel<IOrder>>(
      `/orders/${orderId}/accept`,
      { prepMinutes }
    );
    return res.data.data!;
  },

  async rejectOrder(orderId: string, reason: string): Promise<IOrder> {
    const res = await apiClient.post<ResponseModel<IOrder>>(
      `/orders/${orderId}/reject`,
      { reason }
    );
    return res.data.data!;
  },

  async progressStatus(
    orderId: string,
    status: OrderStatus,
    note?: string
  ): Promise<IOrder> {
    const res = await apiClient.post<ResponseModel<IOrder>>(
      `/orders/${orderId}/status`,
      { status, note }
    );
    return res.data.data!;
  },

  async cancelOrder(orderId: string, reason: string): Promise<IOrder> {
    const res = await apiClient.post<ResponseModel<IOrder>>(
      `/orders/${orderId}/cancel`,
      { reason }
    );
    return res.data.data!;
  },

  async updatePayment(
    orderId: string,
    paymentStatus: PaymentStatus
  ): Promise<IOrder> {
    const res = await apiClient.patch<ResponseModel<IOrder>>(
      `/orders/${orderId}/payment`,
      { paymentStatus }
    );
    return res.data.data!;
  },

  async updateNote(orderId: string, internalNote: string): Promise<IOrder> {
    const res = await apiClient.patch<ResponseModel<IOrder>>(
      `/orders/${orderId}/note`,
      { internalNote }
    );
    return res.data.data!;
  },
};

export interface IStoreRider {
  id: string;
  name: string;
  phone: string;
  vehicleNumber?: string;
  isOnline: boolean;
  activeOrders: number;
}

export const riderApi = {
  list: async (): Promise<IStoreRider[]> => {
    const res = await apiClient.get<ResponseModel<IStoreRider[]>>("/riders");
    return res.data.data || [];
  },

  assign: async (orderId: string, riderId: string): Promise<IOrder> => {
    const res = await apiClient.post<ResponseModel<IOrder>>(`/orders/${orderId}/assign-rider`, {
      riderId,
    });
    return res.data.data!;
  },
};
