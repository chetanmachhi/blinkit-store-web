import { createPortal } from "react-dom";
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { staffApi, IStaffUser } from "../../api/staff.service";
import { useAuthStore } from "../../store/authStore";
import { StoreRole } from "../../types/domain";

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: IStaffUser | null;
  onSuccess: () => void;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  staff,
  onSuccess,
}) => {
  const stores = useAuthStore((state) => state.stores);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeRole, setStoreRole] = useState<StoreRole>("staff");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      setName(staff.name);
      setEmail(staff.email);
      setPassword("");
      setStoreRole(staff.storeRole);
      setSelectedStores(staff.storeIds || []);
      setIsActive(staff.isActive);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setStoreRole("staff");
      setSelectedStores(activeStoreId ? [activeStoreId] : []);
      setIsActive(true);
    }
    setError(null);
  }, [staff, isOpen, activeStoreId]);

  if (!isOpen) return null;

  const handleToggleStore = (storeId: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!staff && !email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!staff && (!password || password.length < 8)) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (staff) {
        await staffApi.update(staff.id, {
          name: name.trim(),
          storeRole,
          storeIds: selectedStores,
          isActive,
        });
      } else {
        await staffApi.create({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          storeRole,
          storeIds: selectedStores,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Failed to save staff member.");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {staff ? "Edit Staff Member" : "Add Staff Member"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled={Boolean(staff)}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@blinkit-store.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
            />
          </div>

          {!staff && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Initial Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <select
              value={storeRole}
              onChange={(e) => setStoreRole(e.target.value as StoreRole)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="staff">Staff (Orders & Stock Management)</option>
              <option value="owner">Owner (Full Store Admin Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Assigned Stores
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave all unselected to grant access to all stores.
            </p>
            <div className="mt-2 space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              {stores.map((s) => (
                <label key={s.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedStores.includes(s.id)}
                    onChange={() => handleToggleStore(s.id)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {staff && (
            <div className="pt-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Active Account</span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{staff ? "Save Changes" : "Create User"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
