import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, Loader2 } from "lucide-react";
import { customerApi } from "../api/customer.service";
import { ICustomerBrief } from "../types/domain";
import { formatRupees } from "../utils/money";
import dayjs from "dayjs";

export const CustomersScreen: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomerBrief[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async (q?: string) => {
    setIsLoading(true);
    try {
      const res: any = await customerApi.list(q);
      const items = res?.items || (Array.isArray(res) ? res : res?.data?.items || []);
      setCustomers(items);
    } catch {
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCustomers(searchQuery.trim() || undefined);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Customer Directory
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            View customer order frequencies, lifetime spend, and contact records
          </p>
        </div>
      </div>

      <div className="flex items-center rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or email..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Total Orders</th>
                <th className="px-4 py-3 font-semibold">Lifetime Spend</th>
                <th className="px-4 py-3 font-semibold">Last Order</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <span className="mt-2 block">Loading customers...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No customers found matching search term.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-700/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-950/40 dark:text-emerald-400">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {c.name}
                          </span>
                          <p className="text-[11px] text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">
                      {c.phone}
                    </td>

                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {c.orderCount} {c.orderCount === 1 ? "order" : "orders"}
                    </td>

                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupees(c.totalSpent)}
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {c.lastOrderAt ? dayjs(c.lastOrderAt).format("DD MMM YYYY") : "Never"}
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {dayjs(c.createdAt).format("DD MMM YYYY")}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/customers/${c.id}`}
                        className="inline-flex items-center space-x-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Profile</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
