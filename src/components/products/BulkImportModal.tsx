import { createPortal } from "react-dom";
import React, { useState } from "react";
import Papa from "papaparse";
import { X, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2 } from "lucide-react";
import { productApi, IBulkImportRow, IBulkImportResult } from "../../api/product.service";
import { useAuthStore } from "../../store/authStore";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<IBulkImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dryRunResults, setDryRunResults] = useState<IBulkImportResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setParseError(null);
    setDryRunResults(null);
    setIsCommitted(false);

    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows: IBulkImportRow[] = results.data.map((row) => ({
            name: (row.name || row.Name || "").trim(),
            categorySlug: (row.categorySlug || row.CategorySlug || row.category || "").trim(),
            brand: (row.brand || row.Brand || "").trim() || undefined,
            unit: (row.unit || row.Unit || "1 unit").trim(),
            mrp: Number(row.mrp || row.MRP || 0),
            price: Number(row.price || row.Price || 0),
            stock: Number(row.stock || row.Stock || 0),
            imageUrl: (row.imageUrl || row.ImageUrl || row.image || "").trim() || undefined,
            description: (row.description || row.Description || "").trim() || undefined,
          }));

          if (rows.length === 0) {
            setParseError("CSV file contains no valid data rows.");
            return;
          }
          if (rows.length > 500) {
            setParseError("Maximum 500 rows allowed per import.");
            return;
          }
          setParsedRows(rows);
        } catch (err: any) {
          setParseError(err.message || "Failed to process CSV file.");
        }
      },
      error: (err) => {
        setParseError(err.message || "Failed to parse CSV file.");
      },
    });
  };

  const handleDryRun = async () => {
    if (!activeStoreId || parsedRows.length === 0) return;
    setIsLoading(true);
    setParseError(null);
    try {
      const res = await productApi.bulkImport(activeStoreId, {
        dryRun: true,
        rows: parsedRows,
      });
      setDryRunResults(res.data.results);
    } catch (err: any) {
      setParseError(err.response?.data?.error?.message || err.message || "Dry run failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!activeStoreId || parsedRows.length === 0) return;
    setIsLoading(true);
    setParseError(null);
    try {
      const res = await productApi.bulkImport(activeStoreId, {
        dryRun: false,
        rows: parsedRows,
      });
      setDryRunResults(res.data.results);
      setIsCommitted(true);
      onSuccess();
    } catch (err: any) {
      setParseError(err.response?.data?.error?.message || err.message || "Import failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const errorCount = dryRunResults?.filter((r) => r.status === "error").length ?? 0;
  const createdCount = dryRunResults?.filter((r) => r.status === "created").length ?? 0;
  const updatedCount = dryRunResults?.filter((r) => r.status === "updated").length ?? 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Bulk Import Products
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload product catalog CSV
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Required headers: name, categorySlug, unit, mrp, price, stock
            </p>
            <label className="mt-4 inline-block cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Select CSV File
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Loaded: {file.name} ({parsedRows.length} rows)
              </p>
            )}
          </div>

          {parseError && (
            <div className="flex items-center space-x-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {dryRunResults && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    To Create
                  </span>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {createdCount}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-950/30">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    To Update
                  </span>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                    {updatedCount}
                  </p>
                </div>
                <div className="rounded-lg bg-rose-50 p-3 text-center dark:bg-rose-950/30">
                  <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
                    Errors
                  </span>
                  <p className="text-xl font-bold text-rose-700 dark:text-rose-400">
                    {errorCount}
                  </p>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dryRunResults.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 py-2 font-mono">{r.row}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded px-1.5 py-0.5 font-medium ${
                              r.status === "error"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                                : r.status === "created"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                          {r.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isCommitted ? "Close" : "Cancel"}
          </button>
          <div className="flex space-x-3">
            {!dryRunResults && (
              <button
                type="button"
                onClick={handleDryRun}
                disabled={isLoading || parsedRows.length === 0}
                className="flex items-center space-x-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Validate CSV</span>
              </button>
            )}
            {dryRunResults && !isCommitted && (
              <button
                type="button"
                onClick={handleCommit}
                disabled={isLoading || errorCount > 0}
                className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle2 className="h-4 w-4" />
                <span>Import {parsedRows.length - errorCount} Products</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
