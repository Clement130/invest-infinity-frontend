import React, { ReactNode } from 'react';
import { Checkbox } from '../ui/checkbox';
import TableSortHeader from './TableSortHeader';
import TablePagination from './TablePagination';
import { Download, Search, X } from 'lucide-react';
import { useDataTable, type UseDataTableOptions } from '../../hooks/useDataTable';
import { exportData, type ExportFormat } from '../../services/exportService';

export type Column<T> = {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
  className?: string;
};

export interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  getRowId?: (row: T, index: number) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  exportFormats?: ExportFormat[];
  exportFilename?: string;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: Set<string | number>) => void;
  pageSize?: number;
  defaultSort?: { column: keyof T | null; direction: 'asc' | 'desc' | null };
  persistState?: boolean;
  storageKey?: string;
  emptyMessage?: string;
  className?: string;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  getRowId = (_, index) => index,
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  exportable = true,
  exportFormats = ['csv', 'excel'],
  exportFilename = 'export',
  selectable = false,
  onRowClick,
  onSelectionChange,
  pageSize = 25,
  defaultSort = { column: null, direction: null },
  persistState = false,
  storageKey = 'datatable',
  emptyMessage = 'Aucune donnée disponible',
  className = '',
}: DataTableProps<T>) {
  const searchableColumns = columns.map((col) => col.key);

  const {
    data: paginatedData,
    totalItems,
    totalPages,
    page,
    pageSize: currentPageSize,
    sort,
    search,
    selectedRows,
    selectedCount,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    toggleRowSelection,
    toggleAllRowsSelection,
    clearSelection,
    isAllSelected,
    isIndeterminate,
  } = useDataTable<T>({
    data,
    pageSize,
    defaultSort,
    getRowId,
    searchableColumns,
    persistState,
    storageKey,
  });

  // Notifier les changements de sélection
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRows);
    }
  }, [selectedRows, onSelectionChange]);

  const handleExport = (format: ExportFormat) => {
    // Exporter toutes les données filtrées, pas seulement la page actuelle
    const allData = data.filter((row) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return searchableColumns.some((col) => {
        const value = row[col];
        return value?.toString().toLowerCase().includes(searchLower);
      });
    });

    const exportColumns = columns.map((col) => String(col.key));
    exportData(allData, format, {
      filename: exportFilename,
      includeHeaders: true,
      columns: exportColumns,
    });
  };

  return (
    <div className={`bg-slate-900 rounded-lg border border-white/10 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/5 transition"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          )}

          {selectable && selectedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{selectedCount} sélectionné(s)</span>
              <button
                onClick={clearSelection}
                className="text-purple-400 hover:text-purple-300 transition"
              >
                Tout désélectionner
              </button>
            </div>
          )}
        </div>

        {exportable && (
          <div className="flex items-center gap-2">
            {exportFormats.map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition"
                title={`Exporter en ${format.toUpperCase()}`}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{format.toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onCheckedChange={toggleAllRowsSelection}
                  />
                </th>
              )}
              {columns.map((column) => (
                <TableSortHeader
                  key={String(column.key)}
                  label={column.label}
                  column={String(column.key)}
                  currentSort={sort}
                  onSort={(col) => setSort(col as keyof T)}
                  className={column.className}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  {search ? 'Aucun résultat trouvé' : emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const rowId = getRowId(row, index);
                const isSelected = selectedRows.has(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={`hover:bg-white/5 transition ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-purple-500/10' : ''}`}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRowSelection(rowId)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={String(column.key)} className={`px-4 py-3 ${column.className || ''}`}>
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] != null
                            ? String(row[column.key])
                            : '-'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePagination
          page={page}
          pageSize={currentPageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

