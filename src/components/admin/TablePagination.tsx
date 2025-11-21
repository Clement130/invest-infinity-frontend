import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: TablePaginationProps) {
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-slate-900">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Afficher</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-400">éléments</span>
        </div>
        <div className="text-sm text-gray-400">
          {totalItems > 0 ? (
            <>
              {startItem}-{endItem} sur {totalItems}
            </>
          ) : (
            'Aucun résultat'
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Première page"
        >
          <ChevronsLeft className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Page précédente"
        >
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (page < 3) {
              pageNum = i;
            } else if (page > totalPages - 4) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[32px] px-2 py-1 rounded text-sm transition ${
                  page === pageNum
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Page suivante"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Dernière page"
        >
          <ChevronsRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

