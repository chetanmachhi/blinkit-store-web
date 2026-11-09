import React, { useState, useEffect } from "react";
import { Plus, Edit2, KeyRound, Shield, Loader2 } from "lucide-react";
import { staffApi, IStaffUser } from "../api/staff.service";
import { useAuthStore, AuthState } from "../store/authStore";
import { StaffFormModal } from "../components/staff/StaffFormModal";
import { ResetPasswordModal } from "../components/staff/ResetPasswordModal";

export const StaffScreen: React.FC = () => {
  const currentUserId = useAuthStore((state: AuthState) => state.user?.id);
  const [staffList, setStaffList] = useState<IStaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<IStaffUser | null>(null);
  const [selectedStaffForReset, setSelectedStaffForReset] = useState<IStaffUser | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await staffApi.list();
      setStaffList(res.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Staff & Access Control
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage store employees, assigned permissions, and operational accounts
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Store Role</th>
                <th className="px-4 py-3 font-semibold">Assigned Scope</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <span className="mt-2 block">Loading staff accounts...</span>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No staff accounts configured.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => {
                  const isSelf = staff.id === currentUserId;

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-700/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {staff.name}
                              </span>
                              {isSelf && (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400">{staff.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center space-x-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            staff.storeRole === "owner"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          <span>{staff.storeRole}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {staff.storeIds && staff.storeIds.length > 0
                          ? `${staff.storeIds.length} store(s) assigned`
                          : "All Outlets (Global)"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${
                            staff.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                          }`}
                        >
                          {staff.isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedStaffForReset(staff)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Reset Password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedStaffForEdit(staff)}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Edit Permissions"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StaffFormModal
        isOpen={isCreateOpen || Boolean(selectedStaffForEdit)}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedStaffForEdit(null);
        }}
        staff={selectedStaffForEdit}
        onSuccess={fetchStaff}
      />

      <ResetPasswordModal
        isOpen={Boolean(selectedStaffForReset)}
        onClose={() => setSelectedStaffForReset(null)}
        staff={selectedStaffForReset}
        onSuccess={fetchStaff}
      />
    </div>
  );
};
