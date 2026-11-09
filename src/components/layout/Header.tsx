import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Store as StoreIcon,
  User,
  LogOut,
  Power,
  ChevronDown,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { useSoundStore } from "../../store/soundStore";
import { storeService } from "../../api/store.service";
import { authService } from "../../api/auth.service";
import { ConfirmDialog } from "../common/ConfirmDialog";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const {
    user,
    storeRole,
    stores,
    activeStoreId,
    setActiveStoreId,
    updateStoreAcceptingStatus,
    clearAuth,
  } = useAuthStore();

  const { isDark, toggleTheme } = useThemeStore();
  const { isMuted, toggleMute } = useSoundStore();

  const currentStore = stores.find((s) => s.id === activeStoreId) || stores[0];
  const isAccepting = currentStore?.isAcceptingOrders ?? true;

  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [isUpdatingAccepting, setIsUpdatingAccepting] = useState(false);
  const [pausedReason, setPausedReason] = useState("");

  const handleToggleAccepting = async () => {
    if (!currentStore) return;

    if (isAccepting) {
      setIsPauseDialogOpen(true);
      return;
    }

    try {
      setIsUpdatingAccepting(true);
      await storeService.setAcceptingOrders(currentStore.id, true);
      updateStoreAcceptingStatus(true);
    } finally {
      setIsUpdatingAccepting(false);
    }
  };

  const handleConfirmPause = async () => {
    if (!currentStore) return;
    try {
      setIsUpdatingAccepting(true);
      await storeService.setAcceptingOrders(
        currentStore.id,
        false,
        pausedReason || "Paused by store staff"
      );
      updateStoreAcceptingStatus(false, pausedReason);
      setIsPauseDialogOpen(false);
      setPausedReason("");
    } finally {
      setIsUpdatingAccepting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-bg-card px-4 sm:px-6 shadow-sm no-print">
      <div className="mr-3 flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {stores.length > 1 ? (
          <div className="flex min-w-0 items-center gap-2">
            <StoreIcon className="w-4 h-4 text-brand shrink-0" />
            <select
              value={activeStoreId || ""}
              onChange={(e) => setActiveStoreId(e.target.value)}
              className="bg-bg-muted border border-border rounded-lg text-xs font-semibold px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2 font-semibold text-sm text-text-primary">
            <StoreIcon className="w-4 h-4 shrink-0 text-brand" />
            <span className="truncate" title={currentStore?.name}>
              {currentStore?.name || "Blinkit Store"}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
        {currentStore && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAccepting}
              disabled={isUpdatingAccepting}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                isAccepting
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                  : "bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700"
              }`}
              title={isAccepting ? "Click to pause orders" : "Click to resume accepting orders"}
            >
              <Power className={`w-3.5 h-3.5 ${isAccepting ? "text-brand" : "text-status-danger"}`} />
              <span className="hidden sm:inline">
                {isAccepting ? "Accepting Orders" : "Orders Paused"}
              </span>
              <span className="sm:hidden">{isAccepting ? "Active" : "Paused"}</span>
            </button>
          </div>
        )}

        <button
          onClick={toggleMute}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted transition-colors"
          title={isMuted ? "Unmute order alert sound" : "Mute order alert sound"}
          aria-label={isMuted ? "Unmute sound" : "Mute sound"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-status-warning" />
          ) : (
            <Volume2 className="w-4 h-4 text-brand" />
          )}
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-muted transition-colors focus:outline-none">
              <div className="w-7 h-7 rounded-full bg-brand-soft text-brand font-bold text-xs flex items-center justify-center">
                {user?.name?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold leading-tight text-text-primary">
                  {user?.name || "Store User"}
                </div>
                <div className="text-[10px] text-text-muted uppercase font-medium">
                  {storeRole || "Staff"}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden md:block" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 w-48 rounded-xl border border-border bg-bg-card p-1.5 shadow-xl text-sm focus:outline-none space-y-1"
            >
              <DropdownMenu.Item asChild>
                <Link
                  to="/account"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-primary hover:bg-bg-muted cursor-pointer text-xs font-medium"
                >
                  <User className="w-4 h-4" />
                  My Account
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-border my-1" />

              <DropdownMenu.Item asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-status-danger hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer text-xs font-medium text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <ConfirmDialog
        open={isPauseDialogOpen}
        onOpenChange={setIsPauseDialogOpen}
        title="Pause incoming orders?"
        description="Customers will receive an alert that the dark store is temporarily not taking new orders until you resume."
        confirmLabel="Pause Orders"
        isDestructive={true}
        isLoading={isUpdatingAccepting}
        onConfirm={handleConfirmPause}
      />
    </header>
  );
};
