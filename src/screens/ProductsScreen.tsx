import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Upload,
  Download,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { productApi } from "../api/product.service";
import { categoryApi } from "../api/category.service";
import { IProduct, ICategory } from "../types/domain";
import { useAuthStore, AuthState } from "../store/authStore";
import { paiseToRupeeString, rupeeStringToPaise, formatRupees } from "../utils/money";
import { ProductFormModal } from "../components/products/ProductFormModal";
import { BulkImportModal } from "../components/products/BulkImportModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { exportToCsv } from "../utils/exportCsv";

import { Pagination } from "../types/api";

export const ProductsScreen: React.FC = () => {
  const activeStoreId = useAuthStore((state: AuthState) => state.activeStoreId);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    pages: 1,
    hasNext: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryIdFilter, setCategoryIdFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProductForEdit, setSelectedProductForEdit] = useState<IProduct | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<IProduct | null>(null);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState("");
  const [inlineMrp, setInlineMrp] = useState("");
  const [inlineStock, setInlineStock] = useState("");
  const [inlineAvailable, setInlineAvailable] = useState(true);
  const [isInlineSaving, setIsInlineSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.list();
      setCategories(res.data);
    } catch {}
  };

  const fetchProducts = async (page = 1) => {
    if (!activeStoreId) return;
    setIsLoading(true);
    try {
      const res = await productApi.list(activeStoreId, {
        page,
        limit: 20,
        q: searchQuery.trim() || undefined,
        categoryId: categoryIdFilter || undefined,
        lowStock: lowStockFilter ? true : undefined,
        includeDeleted: includeDeleted ? true : undefined,
      });
      setProducts(res.data.items);
      setPagination(res.data.pagination);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [activeStoreId, searchQuery, categoryIdFilter, lowStockFilter, includeDeleted]);

  const handleStartInlineEdit = (p: IProduct) => {
    setEditingRowId(p._id);
    setInlinePrice(paiseToRupeeString(p.price));
    setInlineMrp(paiseToRupeeString(p.mrp));
    setInlineStock(p.stock.toString());
    setInlineAvailable(p.isAvailable);
  };

  const handleCancelInlineEdit = () => {
    setEditingRowId(null);
  };

  const handleSaveInlineEdit = async (productId: string) => {
    const pricePaise = rupeeStringToPaise(inlinePrice);
    const mrpPaise = rupeeStringToPaise(inlineMrp);
    const stockNum = parseInt(inlineStock, 10);

    if (pricePaise > mrpPaise) {
      alert("Selling price cannot exceed MRP.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      alert("Stock must be a positive integer.");
      return;
    }

    setIsInlineSaving(true);
    try {
      await productApi.quickUpdate(productId, {
        price: pricePaise,
        mrp: mrpPaise,
        stock: stockNum,
        isAvailable: inlineAvailable,
      });
      setEditingRowId(null);
      await fetchProducts(pagination.page);
    } finally {
      setIsInlineSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await productApi.delete(productToDelete._id);
      setProductToDelete(null);
      await fetchProducts(pagination.page);
    } catch {}
  };

  const handleRestoreProduct = async (productId: string) => {
    try {
      await productApi.restore(productId);
      await fetchProducts(pagination.page);
    } catch {}
  };

  const handleExportCsv = async () => {
    if (!activeStoreId) return;
    try {
      const res = await productApi.export(activeStoreId);
      const csvData = res.data.map((p: IProduct) => ({
        Name: p.name,
        Brand: p.brand || "",
        Unit: p.unit,
        MRP: paiseToRupeeString(p.mrp),
        Price: paiseToRupeeString(p.price),
        Stock: p.stock,
        LowStockThreshold: p.lowStockThreshold,
        Available: p.isAvailable ? "Yes" : "No",
        Category: typeof p.categoryId === "object" ? (p.categoryId as any).name : "",
      }));
      exportToCsv("products_export.csv", csvData);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Catalog & Inventory
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total {pagination.total} catalog items
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Import CSV</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, brand, barcode..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryIdFilter}
            onChange={(e) => setCategoryIdFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`inline-flex items-center space-x-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
              lowStockFilter
                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock Only</span>
          </button>

          <label className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Show Archival/Deleted</span>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">MRP (₹)</th>
                <th className="px-4 py-3 font-semibold">Selling Price (₹)</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Available</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <span className="mt-2 block">Loading catalog...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isEditing = editingRowId === product._id;
                  const isLow = product.stock <= product.lowStockThreshold;

                  return (
                    <tr
                      key={product._id}
                      className={`hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-700/40 ${
                        product.isDeleted ? "opacity-60 bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {product.name}
                            </span>
                            <div className="text-[11px] text-gray-500">
                              {product.unit} {product.brand ? `• ${product.brand}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {typeof product.categoryId === "object"
                          ? (product.categoryId as any)?.name
                          : "-"}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={inlineMrp}
                            onChange={(e) => setInlineMrp(e.target.value)}
                            className="w-16 rounded border border-gray-300 px-1.5 py-1 text-xs dark:bg-gray-700 dark:text-white"
                          />
                        ) : (
                          <span className="text-gray-500 line-through">
                            {formatRupees(product.mrp)}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            value={inlinePrice}
                            onChange={(e) => setInlinePrice(e.target.value)}
                            className="w-16 rounded border border-emerald-500 px-1.5 py-1 text-xs dark:bg-gray-700 dark:text-white"
                          />
                        ) : (
                          formatRupees(product.price)
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={inlineStock}
                            onChange={(e) => setInlineStock(e.target.value)}
                            className="w-16 rounded border border-gray-300 px-1.5 py-1 text-xs dark:bg-gray-700 dark:text-white"
                          />
                        ) : (
                          <span
                            className={`inline-flex items-center space-x-1 rounded px-2 py-0.5 font-bold ${
                              isLow
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                : "text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            <span>{product.stock}</span>
                            {isLow && <AlertTriangle className="h-3 w-3" />}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={inlineAvailable}
                            onChange={(e) => setInlineAvailable(e.target.checked)}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        ) : (
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${
                              product.isAvailable
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                            }`}
                          >
                            {product.isAvailable ? "Active" : "Hidden"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleSaveInlineEdit(product._id)}
                              disabled={isInlineSaving}
                              className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelInlineEdit}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleStartInlineEdit(product)}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Quick Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedProductForEdit(product)}
                              className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Full Edit"
                            >
                              Edit
                            </button>

                            {product.isDeleted ? (
                              <button
                                onClick={() => handleRestoreProduct(product._id)}
                                className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                title="Restore"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setProductToDelete(product)}
                                className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages || pagination.pages || 1}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchProducts(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchProducts(pagination.page + 1)}
              disabled={pagination.page >= (pagination.totalPages || pagination.pages || 1) || isLoading}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <ProductFormModal
        isOpen={isCreateOpen || Boolean(selectedProductForEdit)}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedProductForEdit(null);
        }}
        product={selectedProductForEdit}
        categories={categories}
        onSuccess={() => fetchProducts(pagination.page)}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => fetchProducts(1)}
      />

      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to soft-delete "${productToDelete?.name}"? You can restore it later if needed.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
