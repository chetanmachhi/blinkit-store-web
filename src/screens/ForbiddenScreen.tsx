import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const ForbiddenScreen: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        403 - Access Denied
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
        You do not have the required permissions to view this screen. Only store owners or authorized staff can access this area.
      </p>
      <Link
        to="/live"
        className="mt-6 inline-flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Live Orders</span>
      </Link>
    </div>
  );
};
