import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderTree,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { categoryApi } from "../api/category.service";
import { ICategory } from "../types/domain";
import { CategoryFormModal } from "../components/categories/CategoryFormModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

export const CategoriesScreen: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<ICategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setDeleteError(null);
    try {
      const res = await categoryApi.list();
      setCategories(res.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    setCategories(newCategories);

    const reorderPayload = newCategories.map((c, i) => ({
      id: c._id,
      sortOrder: i,
    }));

    try {
      await categoryApi.reorder(reorderPayload);
    } catch {
      await fetchCategories();
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteError(null);
    try {
      await categoryApi.delete(categoryToDelete._id);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (err: any) {
      setDeleteError(
        err.response?.data?.error?.message ||
          err.message ||
          "Cannot delete category. Active products may be assigned to it."
      );
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Category Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Structure your store catalog taxonomy and display sequence
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {deleteError && (
        <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold w-16">Order</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <span className="mt-2 block">Loading categories...</span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No categories found. Create your first category above.
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => (
                  <tr
                    key={cat._id}
                    className="hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-700/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMove(idx, "up")}
                          disabled={idx === 0}
                          className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:hover:text-gray-200"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, "down")}
                          disabled={idx === categories.length - 1}
                          className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:hover:text-gray-200"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="h-9 w-9 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {cat.name}
                          </span>
                          {cat.parentId && (
                            <span className="ml-2 inline-flex items-center space-x-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              <FolderTree className="h-2.5 w-2.5" />
                              <span>Subcategory</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-gray-500">{cat.slug}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${
                          cat.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedCategoryForEdit(cat)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CategoryFormModal
        isOpen={isCreateOpen || Boolean(selectedCategoryForEdit)}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedCategoryForEdit(null);
        }}
        category={selectedCategoryForEdit}
        categories={categories}
        onSuccess={fetchCategories}
      />

      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? Deletion will be rejected if active catalog items are attached.`}
        confirmText="Delete Category"
        variant="danger"
      />
    </div>
  );
};
