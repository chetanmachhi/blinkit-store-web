import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ToastContainer } from "./components/common/ToastContainer";
import { ColdStartModal } from "./components/common/ColdStartModal";
import { LoadingState } from "./components/common/LoadingState";

const LoginScreen = lazy(() =>
  import("./screens/LoginScreen").then((m) => ({ default: m.LoginScreen }))
);
const LiveOrdersScreen = lazy(() =>
  import("./screens/LiveOrdersScreen").then((m) => ({ default: m.LiveOrdersScreen }))
);
const OrdersScreen = lazy(() =>
  import("./screens/OrdersScreen").then((m) => ({ default: m.OrdersScreen }))
);
const OrderDetailScreen = lazy(() =>
  import("./screens/OrderDetailScreen").then((m) => ({ default: m.OrderDetailScreen }))
);
const ProductsScreen = lazy(() =>
  import("./screens/ProductsScreen").then((m) => ({ default: m.ProductsScreen }))
);
const CategoriesScreen = lazy(() =>
  import("./screens/CategoriesScreen").then((m) => ({ default: m.CategoriesScreen }))
);
const CouponsScreen = lazy(() =>
  import("./screens/CouponsScreen").then((m) => ({ default: m.CouponsScreen }))
);
const CustomersScreen = lazy(() =>
  import("./screens/CustomersScreen").then((m) => ({ default: m.CustomersScreen }))
);
const CustomerDetailScreen = lazy(() =>
  import("./screens/CustomerDetailScreen").then((m) => ({ default: m.CustomerDetailScreen }))
);
const StaffScreen = lazy(() =>
  import("./screens/StaffScreen").then((m) => ({ default: m.StaffScreen }))
);
const StoreSettingsScreen = lazy(() =>
  import("./screens/StoreSettingsScreen").then((m) => ({ default: m.StoreSettingsScreen }))
);
const DashboardScreen = lazy(() =>
  import("./screens/DashboardScreen").then((m) => ({ default: m.DashboardScreen }))
);
const AccountScreen = lazy(() =>
  import("./screens/AccountScreen").then((m) => ({ default: m.AccountScreen }))
);
const ForbiddenScreen = lazy(() =>
  import("./screens/ForbiddenScreen").then((m) => ({ default: m.ForbiddenScreen }))
);
const NotFoundScreen = lazy(() =>
  import("./screens/NotFoundScreen").then((m) => ({ default: m.NotFoundScreen }))
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ColdStartModal />
      <ToastContainer />
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/403" element={<ForbiddenScreen />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/live" replace />} />
              <Route path="/live" element={<LiveOrdersScreen />} />
              <Route path="/live-orders" element={<Navigate to="/live" replace />} />
              <Route path="/orders" element={<OrdersScreen />} />
              <Route path="/orders/:orderId" element={<OrderDetailScreen />} />
              <Route path="/products" element={<ProductsScreen />} />
              <Route path="/categories" element={<CategoriesScreen />} />
              <Route path="/coupons" element={<CouponsScreen />} />
              <Route path="/customers" element={<CustomersScreen />} />
              <Route path="/customers/:customerId" element={<CustomerDetailScreen />} />
              <Route path="/staff" element={<StaffScreen />} />
              <Route path="/settings" element={<StoreSettingsScreen />} />
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route path="/account" element={<AccountScreen />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundScreen />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
