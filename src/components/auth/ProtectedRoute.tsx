import React, { useEffect } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import axios from "axios";
import {
  useAuthStore,
  useCan,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from "../../store/authStore";
import { env } from "../../env";
import { ResponseModel } from "../../types/api";
import { IAuthMeResponse } from "../../types/domain";

let refreshInFlight: Promise<void> | null = null;

interface ProtectedRouteProps {
  children?: React.ReactNode;
  permission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
}) => {
  const location = useLocation();
  const { accessToken, isInitializing, setAuthData, clearAuth, setInitializing } =
    useAuthStore();
  const hasRefreshToken = Boolean(getStoredRefreshToken());
  const hasAccess = permission ? useCan(permission) : true;

  useEffect(() => {
    if (!accessToken && hasRefreshToken) {
      if (!refreshInFlight) {
        refreshInFlight = (async () => {
          const token = getStoredRefreshToken();
          if (!token) {
            setInitializing(false);
            return;
          }
          try {
            const resp = await axios.post<
              ResponseModel<{ accessToken: string; refreshToken: string }>
            >(
              `${env.VITE_API_BASE_URL}/auth/refresh`,
              { refreshToken: token },
              { headers: { "Content-Type": "application/json" } }
            );
            const data = resp.data?.data;
            if (data?.accessToken && data?.refreshToken) {
              const isLocalStorage =
                typeof window !== "undefined" &&
                localStorage.getItem("store_refresh_token") !== null;
              setStoredRefreshToken(data.refreshToken, isLocalStorage);

              const meResp = await axios.get<ResponseModel<IAuthMeResponse>>(
                `${env.VITE_API_BASE_URL}/auth/me`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${data.accessToken}`,
                  },
                }
              );

              if (meResp.data?.data) {
                setAuthData(data.accessToken, meResp.data.data, isLocalStorage);
                return;
              }
            }
            clearAuth();
          } catch {
            clearAuth();
          } finally {
            setInitializing(false);
            refreshInFlight = null;
          }
        })();
      }
    } else {
      setInitializing(false);
    }
  }, [accessToken, hasRefreshToken, setAuthData, clearAuth, setInitializing]);

  if (isInitializing && hasRefreshToken && !accessToken) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
          <p className="text-sm text-text-muted">Loading store session...</p>
        </div>
      </div>
    );
  }

  if (!accessToken && !hasRefreshToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return <>{children || <Outlet />}</>;
};
