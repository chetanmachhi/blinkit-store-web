import React from "react";
import { NavLink } from "react-router-dom";
import {
  Zap,
  ShoppingBag,
  Package,
  Layers,
  Tag,
  Users,
  BarChart3,
  UserCheck,
  Settings,
  X,
} from "lucide-react";
import { useAuthStore, useCan } from "../../store/authStore";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { storeRole } = useAuthStore();
  const canManageStaff = useCan("staff:manage");
  const canViewStore = useCan("store:read");

  const navItems = [
    {
      to: "/live-orders",
      label: "Live Orders",
      icon: Zap,
      permission: "orders:read",
      isHero: true,
    },
    {
      to: "/orders",
      label: "Orders History",
      icon: ShoppingBag,
      permission: "orders:read",
    },
    {
      to: "/products",
      label: "Products & Stock",
      icon: Package,
      permission: "products:read",
    },
    {
      to: "/categories",
      label: "Categories",
      icon: Layers,
      permission: "categories:read",
    },
    {
      to: "/coupons",
      label: "Coupons",
      icon: Tag,
      permission: "coupons:read",
    },
    {
      to: "/customers",
      label: "Customers",
      icon: Users,
      permission: "customers:read",
    },
    {
      to: "/dashboard",
      label: "Analytics & Reports",
      icon: BarChart3,
      permission: "dashboard:read",
    },
    ...(canManageStaff
      ? [
          {
            to: "/staff",
            label: "Staff Team",
            icon: UserCheck,
            permission: "staff:manage",
          },
        ]
      : []),
    ...(canViewStore
      ? [
          {
            to: "/settings",
            label: "Store Settings",
            icon: Settings,
            permission: "store:read",
          },
        ]
      : []),
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden no-print"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 no-print ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-black text-lg shadow-sm">
              B
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-text-primary">
                blink<span className="text-brand">it</span>
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-amber/30 text-amber-900 dark:text-amber-300">
                Partner
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? item.isHero
                        ? "bg-brand text-white shadow-sm"
                        : "bg-brand-soft text-brand font-bold"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-muted/70"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-bg-muted/30">
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span className="font-medium">Role: {storeRole === "owner" ? "Store Owner" : "Staff Member"}</span>
            <span className="text-[10px] font-bold bg-border px-1.5 py-0.5 rounded">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
