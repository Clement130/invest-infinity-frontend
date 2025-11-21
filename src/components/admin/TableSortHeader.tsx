import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortDirection } from '../../hooks/useDataTable';

interface TableSortHeaderProps {
  label: string;
  column: string;
  currentSort: { column: string | null; direction: SortDirection };
  onSort: (column: string) => void;
  className?: string;
}

export default function TableSortHeader({
  label,
  column,
  currentSort,
  onSort,
  className = '',
}: TableSortHeaderProps) {
  const isSorted = currentSort.column === column;
  const isAsc = isSorted && currentSort.direction === 'asc';
  const isDesc = isSorted && currentSort.direction === 'desc';

  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex flex-col">
          {!isSorted && (
            <ChevronsUpDown className="w-3 h-3 text-gray-500" />
          )}
          {isAsc && <ChevronUp className="w-3 h-3 text-purple-400" />}
          {isDesc && <ChevronDown className="w-3 h-3 text-purple-400" />}
        </div>
      </div>
    </th>
  );
}

