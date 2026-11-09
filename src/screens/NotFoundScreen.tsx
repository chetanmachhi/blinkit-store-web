import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion, ArrowLeft } from "lucide-react";

export const NotFoundScreen: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        404 - Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
        The page you are looking for does not exist or may have been moved.
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
