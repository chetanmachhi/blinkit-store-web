export type StoreRole = "owner" | "staff";

export type Role = "customer" | "admin";

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "online";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CouponType = "percent" | "flat";

export interface IStoreUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  storeRole: StoreRole;
  storeIds: string[];
}

export interface IStoreBrief {
  id: string;
  name: string;
  isActive: boolean;
  isAcceptingOrders: boolean;
}

export interface IAuthMeResponse {
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
  demoToolsEnabled: boolean;
}

export interface IStore {
  _id: string;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  isAcceptingOrders: boolean;
  pausedReason?: string;
  location: {
    lat: number;
    lng: number;
  };
  deliveryRadiusKm: number;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryAbove: number;
  handlingFee: number;
  avgPrepMinutes: number;
  opensAt: string;
  closesAt: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  children?: ICategory[];
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  _id: string;
  storeId: string;
  categoryId: string | { _id: string; name: string; slug: string };
  name: string;
  description: string;
  brand: string;
  unit: string;
  mrp: number;
  price: number;
  stock: number;
  maxPerOrder: number;
  imageUrl: string;
  images: string[];
  tags: string[];
  sku?: string;
  barcode?: string;
  lowStockThreshold: number;
  isAvailable: boolean;
  isDeleted: boolean;
  sortOrder: number;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  unit: string;
  mrp: number;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface IBill {
  itemTotal: number;
  discount: number;
  deliveryFee: number;
  handlingFee: number;
  grandTotal: number;
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  at: string;
  by?: string | null;
  note?: string;
}

export interface IDeliveryAddress {
  label?: string;
  addressLine: string;
  landmark?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  customer: {
    name: string;
    phone: string;
  };
  items: IOrderItem[];
  bill: IBill;
  totalAmount: number;
  couponCode?: string;
  status: OrderStatus;
  statusHistory: IStatusHistoryEntry[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: IDeliveryAddress;
  notes?: string;
  cancelReason?: string;
  idempotencyKey?: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  acceptedAt?: string;
  prepMinutes?: number;
  rejectionReason?: string;
  cancelledBy?: "customer" | "store";
  internalNote?: string;
  source?: "app" | "demo";
  /** Delivery partner, set when a rider accepts (or the store assigns) the order */
  riderId?: string | null;
  rider?: { name: string; phone: string; vehicleNumber?: string } | null;
  riderAssignedAt?: string;
  pickedUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  perUserLimit: number;
  usedCount: number;
  storeId?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomerBrief {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface ICustomerDetail {
  profile: {
    id: string;
    name: string;
    phone: string;
    email: string;
    createdAt: string;
    isActive: boolean;
  };
  addresses: any[];
  recentOrders: IOrder[];
  stats: {
    orderCount: number;
    deliveredCount: number;
    cancelledCount: number;
    totalSpent: number;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
  };
}

export interface ILiveOrdersData {
  counts: Record<OrderStatus, number>;
  orders: IOrder[];
}

export interface IDashboardMetrics {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  averageOrderValue: number;
  cancellationRate: number;
  newCustomers: number;
  lowStockCount: number;
}

export interface IDashboardDeltas {
  todayOrders: number;
  yesterdayOrders: number;
  ordersDeltaPercent: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueDeltaPercent: number;
}

export interface IDashboardData {
  range: {
    from: string;
    to: string;
    timezone: string;
  };
  metrics: IDashboardMetrics;
  deltas: IDashboardDeltas;
  ordersByStatus: Record<string, number>;
  topProducts: {
    productId: string;
    name: string;
    imageUrl: string;
    quantity: number;
    revenue: number;
  }[];
}
