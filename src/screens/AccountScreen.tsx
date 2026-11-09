import React, { useState } from "react";
import {
  Shield,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  Store,
} from "lucide-react";
import { authApi } from "../api/auth.service";
import { useAuthStore, AuthState } from "../store/authStore";

export const AccountScreen: React.FC = () => {
  const user = useAuthStore((state: AuthState) => state.user);
  const storeRole = useAuthStore((state: AuthState) => state.storeRole);
  const stores = useAuthStore((state: AuthState) => state.stores);
  const clearAuth = useAuthStore((state: AuthState) => state.clearAuth);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!currentPassword || !newPassword) {
      setErrorMsg("Please fill in both current and new password.");
      return;
    }
    if (newPassword.length < 10) {
      setErrorMsg("New password must be at least 10 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    setIsChangingPass(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccessMsg("Password changed successfully. Other active sessions were invalidated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Failed to update password.");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Are you sure you want to sign out of all active devices?")) {
      return;
    }

    setIsLoggingOutAll(true);
    try {
      await authApi.logoutAll();
    } catch {
    } finally {
      clearAuth();
      window.location.href = "/login";
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          My Account & Security
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Manage your credentials, active sessions, and profile settings
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Profile Information
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div>
            <span className="text-gray-500">Full Name</span>
            <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
              {user?.name}
            </p>
          </div>

          <div>
            <span className="text-gray-500">Store Role</span>
            <div className="mt-0.5">
              <span className="inline-flex items-center space-x-1 rounded bg-purple-100 px-2 py-0.5 font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <Shield className="h-3 w-3" />
                <span>{storeRole}</span>
              </span>
            </div>
          </div>

          <div>
            <span className="text-gray-500">Email Address</span>
            <p className="mt-0.5 flex items-center space-x-1.5 text-gray-900 dark:text-white">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <span>{user?.email}</span>
            </p>
          </div>

          <div>
            <span className="text-gray-500">Phone Number</span>
            <p className="mt-0.5 flex items-center space-x-1.5 text-gray-900 dark:text-white font-mono">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span>{user?.phone || "Not set"}</span>
            </p>
          </div>

          <div className="sm:col-span-2 border-t border-gray-100 pt-3 dark:border-gray-700">
            <span className="text-gray-500">Accessible Outlets</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {stores.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-300"
                >
                  <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Change Account Password
        </h2>
        <form onSubmit={handleChangePassword} className="mt-4 max-w-md space-y-3 text-xs">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300">
              New Password (minimum 10 characters)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPass}
            className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isChangingPass ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20">
        <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200">
          Global Session Invalidation
        </h2>
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
          Immediately revoke all refresh tokens and terminate sessions across all browsers and devices.
        </p>

        <button
          onClick={handleLogoutAll}
          disabled={isLoggingOutAll}
          className="mt-4 flex items-center space-x-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
        >
          {isLoggingOutAll ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          <span>Sign Out Everywhere</span>
        </button>
      </div>
    </div>
  );
};
