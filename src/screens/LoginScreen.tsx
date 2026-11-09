import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Store, Loader2, Lock, Mail, AlertCircle } from "lucide-react";
import { authApi } from "../api/auth.service";
import { useAuthStore, AuthState } from "../store/authStore";

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const setAuth = useAuthStore((state: AuthState) => state.setAuth);
  const [email, setEmail] = useState("owner@blinkit.com");
  const [password, setPassword] = useState("Owner@123456");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ email, password });
      if (!res.data) throw new Error("Invalid response from server");
      let { user, storeRole, permissions, stores, accessToken, refreshToken } = res.data;

      if (!stores || !permissions) {
        try {
          const meRes = await authApi.getMe();
          if (meRes.data) {
            user = meRes.data.user || user;
            storeRole = meRes.data.storeRole || storeRole;
            permissions = meRes.data.permissions || permissions || [];
            stores = meRes.data.stores || stores || [];
          }
        } catch {
          stores = stores || [];
          permissions = permissions || [];
        }
      }

      setAuth({
        user,
        storeRole: storeRole || (user as any).storeRole || "owner",
        permissions: permissions || [],
        stores: stores || [],
        accessToken,
        refreshToken,
        rememberMe: keepSignedIn,
      });

      navigate(returnTo, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Store Partner Panel
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Sign in to manage orders, catalog, and store operations
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Work Email
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@blinkit.com"
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Keep me signed in</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Sign In to Store</span>
          </button>
        </form>

        <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
          <p className="font-semibold text-gray-700 dark:text-gray-300">Quick Sign-In:</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("owner@blinkit.com");
                setPassword("Owner@123456");
              }}
              className="flex-1 rounded-md border border-gray-300 bg-white py-1.5 px-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Fill Owner
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("staff@blinkit.com");
                setPassword("Staff@123456");
              }}
              className="flex-1 rounded-md border border-gray-300 bg-white py-1.5 px-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Fill Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
