import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export type ColumnSort<T> = {
  column: keyof T;
  direction: SortDirection;
};

export type DataTableState<T> = {
  page: number;
  pageSize: number;
  sort: ColumnSort<T>;
  search: string;
  selectedRows: Set<string | number>;
};

/**
 * Fonction de tri personnalisée pour une colonne
 * Retourne un nombre négatif si a < b, positif si a > b, 0 si égaux
 */
export type CustomSortFn<T> = (a: T, b: T, direction: 'asc' | 'desc') => number;

export type UseDataTableOptions<T> = {
  data: T[];
  pageSize?: number;
  defaultSort?: ColumnSort<T>;
  getRowId?: (row: T) => string | number;
  searchableColumns?: (keyof T)[];
  persistState?: boolean;
  storageKey?: string;
  /**
   * Fonctions de tri personnalisées par colonne
   * Permet d'implémenter un tri métier (ex: tri par priorité d'abonnement)
   * plutôt qu'un tri alphabétique standard
   */
  customSortFns?: Partial<Record<keyof T, CustomSortFn<T>>>;
};

export function useDataTable<T extends Record<string, any>>({
  data,
  pageSize = 25,
  defaultSort = { column: null, direction: null },
  getRowId = (row: T, index: number) => index,
  searchableColumns,
  persistState = false,
  storageKey = 'datatable-state',
  customSortFns,
}: UseDataTableOptions<T>) {
  const [state, setState] = useState<DataTableState<T>>(() => {
    if (persistState) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            page: parsed.page || 0,
            pageSize: parsed.pageSize || pageSize,
            sort: parsed.sort || defaultSort,
            search: parsed.search || '',
            selectedRows: new Set(parsed.selectedRows || []),
          };
        } catch {
          // Fallback to default
        }
      }
    }
    return {
      page: 0,
      pageSize,
      sort: defaultSort,
      search: '',
      selectedRows: new Set<string | number>(),
    };
  });

  // Sauvegarder l'état si persistState est activé
  const saveState = useCallback(
    (newState: DataTableState<T>) => {
      if (persistState) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            ...newState,
            selectedRows: Array.from(newState.selectedRows),
          })
        );
      }
    },
    [persistState, storageKey]
  );

  // Recherche
  const filteredData = useMemo(() => {
    if (!state.search || !searchableColumns || searchableColumns.length === 0) {
      return data;
    }

    const searchLower = state.search.toLowerCase();
    return data.filter((row) =>
      searchableColumns.some((column) => {
        const value = row[column];
        return value?.toString().toLowerCase().includes(searchLower);
      })
    );
  }, [data, state.search, searchableColumns]);

  // Tri
  const sortedData = useMemo(() => {
    if (!state.sort.column || !state.sort.direction) {
      return filteredData;
    }

    const sortColumn = state.sort.column;
    const sortDirection = state.sort.direction;
    
    // Vérifier si une fonction de tri personnalisée existe pour cette colonne
    const customSortFn = customSortFns?.[sortColumn];

    return [...filteredData].sort((a, b) => {
      // Utiliser la fonction de tri personnalisée si disponible
      if (customSortFn) {
        return customSortFn(a, b, sortDirection);
      }

      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Gérer les valeurs null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Comparaison numérique
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Comparaison de chaînes (tri alphabétique par défaut)
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr, 'fr');
      } else {
        return bStr.localeCompare(aStr, 'fr');
      }
    });
  }, [filteredData, state.sort, customSortFns]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = state.page * state.pageSize;
    const end = start + state.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, state.page, state.pageSize]);

  const totalPages = Math.ceil(sortedData.length / state.pageSize);

  // Actions
  const setPage = useCallback(
    (page: number) => {
      const newState = { ...state, page };
      setState(newState);
      saveState(newState);
    },
    [state, saveState]
  );

  const setPageSize = useCallback(
    (size: number) => {
      const newState = { ...state, pageSize: size, page: 0 };
      setState(newState);
      saveState(newState);
    },
    [state, saveState]
  );

  const setSort = useCallback(
    (column: keyof T) => {
      let direction: SortDirection = 'asc';
      if (state.sort.column === column && state.sort.direction === 'asc') {
        direction = 'desc';
      } else if (state.sort.column === column && state.sort.direction === 'desc') {
        direction = null;
      }

      const newState = {
        ...state,
        sort: { column: direction ? column : null, direction },
        page: 0, // Reset to first page on sort
      };
      setState(newState);
      saveState(newState);
    },
    [state, saveState]
  );

  const setSearch = useCallback(
    (search: string) => {
      const newState = { ...state, search, page: 0 };
      setState(newState);
      saveState(newState);
    },
    [state, saveState]
  );

  const toggleRowSelection = useCallback(
    (rowId: string | number) => {
      const newSelectedRows = new Set(state.selectedRows);
      if (newSelectedRows.has(rowId)) {
        newSelectedRows.delete(rowId);
      } else {
        newSelectedRows.add(rowId);
      }
      const newState = { ...state, selectedRows: newSelectedRows };
      setState(newState);
      saveState(newState);
    },
    [state, saveState]
  );

  const toggleAllRowsSelection = useCallback(() => {
    const allSelected = paginatedData.every((row) => {
      const rowId = getRowId(row, 0);
      return state.selectedRows.has(rowId);
    });

    const newSelectedRows = new Set(state.selectedRows);
    paginatedData.forEach((row) => {
      const rowId = getRowId(row, 0);
      if (allSelected) {
        newSelectedRows.delete(rowId);
      } else {
        newSelectedRows.add(rowId);
      }
    });

    const newState = { ...state, selectedRows: newSelectedRows };
    setState(newState);
    saveState(newState);
  }, [paginatedData, state, getRowId, saveState]);

  const clearSelection = useCallback(() => {
    const newState = { ...state, selectedRows: new Set() };
    setState(newState);
    saveState(newState);
  }, [state, saveState]);

  return {
    // Data
    data: paginatedData,
    filteredData: sortedData,
    totalItems: sortedData.length,
    totalPages,

    // State
    page: state.page,
    pageSize: state.pageSize,
    sort: state.sort,
    search: state.search,
    selectedRows: state.selectedRows,
    selectedCount: state.selectedRows.size,

    // Actions
    setPage,
    setPageSize,
    setSort,
    setSearch,
    toggleRowSelection,
    toggleAllRowsSelection,
    clearSelection,

    // Helpers
    hasNextPage: state.page < totalPages - 1,
    hasPreviousPage: state.page > 0,
    isAllSelected: paginatedData.length > 0 && paginatedData.every((row) => {
      const rowId = getRowId(row, 0);
      return state.selectedRows.has(rowId);
    }),
    isIndeterminate: paginatedData.some((row) => {
      const rowId = getRowId(row, 0);
      return state.selectedRows.has(rowId);
    }) && !paginatedData.every((row) => {
      const rowId = getRowId(row, 0);
      return state.selectedRows.has(rowId);
    }),
  };
}

