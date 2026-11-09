import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pagination } from "../../types/api";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData>({
  columns,
  data,
  pagination,
  onPageChange,
  isLoading = false,
  emptyTitle,
  emptyDescription,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-muted/70 text-text-muted text-xs uppercase font-semibold border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3.5 whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="p-8">
                    <LoadingState message="Loading records..." />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-bg-muted/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && onPageChange && ((pagination.totalPages || pagination.pages || 0) > 1) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted px-2">
          <div>
            Showing page <span className="font-semibold text-text-primary">{pagination.page}</span> of{" "}
            <span className="font-semibold text-text-primary">{pagination.totalPages || pagination.pages || 1}</span> (
            {pagination.total} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-bg-card font-medium text-text-primary hover:bg-bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-bg-card font-medium text-text-primary hover:bg-bg-muted disabled:opacity-40 transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
