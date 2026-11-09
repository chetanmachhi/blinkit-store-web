import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Image as ImageIcon, Check } from "lucide-react";
import { ICategory, IProduct } from "../../types/domain";
import { paiseToRupeeString, rupeeStringToPaise } from "../../utils/money";

import { productApi } from "../../api/product.service";

interface ProductFormModalProps {
  product: IProduct | null;
  categories: ICategory[];
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSubmit?: (data: any) => Promise<void>;
  onSuccess?: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  categories,
  open,
  isOpen,
  onOpenChange,
  onClose,
  onSubmit,
  onSuccess,
}) => {
  const isModalOpen = Boolean(open ?? isOpen);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };
  const isEditing = Boolean(product);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [mrpInput, setMrpInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [stock, setStock] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setBrand(product.brand || "");
      setUnit(product.unit);
      setCategoryId(
        typeof product.categoryId === "object"
          ? (product.categoryId as any)._id
          : product.categoryId
      );
      setMrpInput(paiseToRupeeString(product.mrp));
      setPriceInput(paiseToRupeeString(product.price));
      setStock(String(product.stock));
      setLowStockThreshold(String(product.lowStockThreshold || 10));
      setSku(product.sku || "");
      setBarcode(product.barcode || "");
      setImageUrl(product.imageUrl || "");
      setIsAvailable(product.isAvailable);
    } else {
      setName("");
      setDescription("");
      setBrand("");
      setUnit("");
      setCategoryId(categories[0]?._id || "");
      setMrpInput("");
      setPriceInput("");
      setStock("10");
      setLowStockThreshold("10");
      setSku("");
      setBarcode("");
      setImageUrl("");
      setIsAvailable(true);
    }
    setError(null);
  }, [product, categories, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mrpPaise = rupeeStringToPaise(mrpInput);
    const pricePaise = rupeeStringToPaise(priceInput);

    if (pricePaise > mrpPaise) {
      setError("Selling price cannot exceed MRP");
      return;
    }

    if (mrpPaise <= 0 || pricePaise <= 0) {
      setError("Please enter valid MRP and selling price");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      brand: brand.trim(),
      unit: unit.trim(),
      categoryId,
      mrp: mrpPaise,
      price: pricePaise,
      stock: parseInt(stock, 10) || 0,
      lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      imageUrl: imageUrl.trim(),
      isAvailable,
    };

    try {
      setIsSubmitting(true);
      if (onSubmit) {
        await onSubmit(payload);
      } else if (product) {
        await productApi.update(product._id, payload);
      } else {
        await productApi.create(payload);
      }
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(val) => (!val ? handleClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-bg-card p-6 shadow-2xl border border-border space-y-5 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <Dialog.Title className="text-lg font-bold text-text-primary">
                {isEditing ? "Edit Product" : "Add New Product"}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-text-muted">
                {isEditing
                  ? "Update product catalog details, stock levels, and prices."
                  : "Add an item to the store catalog inventory."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="text-text-muted hover:text-text-primary p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-status-danger/30 text-status-danger text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amul Taaza Toned Milk"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Amul, Britannia"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Unit / Pack Size *
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. 500 ml, 1 kg, 6 pcs"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Availability
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer font-medium text-text-primary">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded border-border text-brand focus:ring-brand w-4 h-4"
                  />
                  Available for customers to buy
                </label>
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  MRP (₹ Rupees) *
                </label>
                <input
                  type="text"
                  required
                  value={mrpInput}
                  onChange={(e) => setMrpInput(e.target.value)}
                  placeholder="e.g. 35.00"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Selling Price (₹ Rupees) *
                </label>
                <input
                  type="text"
                  required
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="e.g. 33.00"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Current Stock Units *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. MLK-AML-500"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 8901262010011"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Image URL
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm"
                  />
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-bg-muted border border-border flex items-center justify-center text-text-muted shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-text-muted uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key product highlights, ingredients, or specifications..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted/30 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                {isSubmitting && (
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <Check className="w-3.5 h-3.5" />
                {isEditing ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
