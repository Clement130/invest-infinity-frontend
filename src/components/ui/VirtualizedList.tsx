import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import clsx from 'clsx';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number; // Nombre d'éléments supplémentaires à rendre
  onEndReached?: () => void; // Callback quand on atteint la fin
  endThreshold?: number; // Distance avant la fin pour déclencher onEndReached
  keyExtractor?: (item: T, index: number) => string | number;
  stickyHeader?: React.ReactNode;
  stickyFooter?: React.ReactNode;
}

interface VisibleRange {
  start: number;
  end: number;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onEndReached,
  endThreshold = 50,
  keyExtractor = (_, index) => index,
  stickyHeader,
  stickyFooter
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({ start: 0, end: 0 });

  // Calculer la hauteur totale
  const totalHeight = useMemo(() => {
    return items.reduce((sum, item, index) => {
      const height = typeof itemHeight === 'function' ? itemHeight(item, index) : itemHeight;
      return sum + height;
    }, 0);
  }, [items, itemHeight]);

  // Calculer les offsets cumulés pour chaque élément
  const itemOffsets = useMemo(() => {
    const offsets: number[] = [];
    let currentOffset = 0;

    items.forEach((item, index) => {
      offsets.push(currentOffset);
      const height = typeof itemHeight === 'function' ? itemHeight(item, index) : itemHeight;
      currentOffset += height;
    });

    return offsets;
  }, [items, itemHeight]);

  // Calculer la plage visible
  const updateVisibleRange = useCallback(() => {
    const startY = scrollTop;
    const endY = scrollTop + containerHeight;

    let start = 0;
    let end = items.length - 1;

    // Trouver le premier élément visible
    for (let i = 0; i < items.length; i++) {
      const itemStart = itemOffsets[i];
      const itemEnd = itemStart + (typeof itemHeight === 'function' ? itemHeight(items[i], i) : itemHeight);

      if (itemEnd > startY - overscan * (typeof itemHeight === 'function' ? itemHeight(items[i], i) : itemHeight)) {
        start = Math.max(0, i - overscan);
        break;
      }
    }

    // Trouver le dernier élément visible
    for (let i = start; i < items.length; i++) {
      const itemStart = itemOffsets[i];
      if (itemStart > endY + overscan * (typeof itemHeight === 'function' ? itemHeight(items[i], i) : itemHeight)) {
        end = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    setVisibleRange({ start, end });

    // Déclencher onEndReached si nécessaire
    if (onEndReached && end >= items.length - endThreshold) {
      onEndReached();
    }
  }, [scrollTop, containerHeight, items, itemHeight, itemOffsets, overscan, onEndReached, endThreshold]);

  useEffect(() => {
    updateVisibleRange();
  }, [updateVisibleRange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Éléments visibles avec padding
  const visibleItems = useMemo(() => {
    const result: { item: T; index: number; offset: number; height: number }[] = [];

    for (let i = visibleRange.start; i <= visibleRange.end && i < items.length; i++) {
      const height = typeof itemHeight === 'function' ? itemHeight(items[i], i) : itemHeight;
      result.push({
        item: items[i],
        index: i,
        offset: itemOffsets[i],
        height
      });
    }

    return result;
  }, [visibleRange, items, itemHeight, itemOffsets]);

  const topPadding = visibleRange.start > 0 ? itemOffsets[visibleRange.start] : 0;
  const bottomPadding = visibleRange.end < items.length - 1
    ? totalHeight - itemOffsets[visibleRange.end + 1] +
      (typeof itemHeight === 'function' ? itemHeight(items[visibleRange.end], visibleRange.end) : itemHeight)
    : 0;

  return (
    <div
      ref={containerRef}
      className={clsx('overflow-auto relative', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Header collant */}
      {stickyHeader && (
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          {stickyHeader}
        </div>
      )}

      {/* Padding supérieur pour simuler les éléments non visibles */}
      {topPadding > 0 && (
        <div style={{ height: topPadding }} />
      )}

      {/* Éléments visibles */}
      <div className="relative">
        {visibleItems.map(({ item, index, offset, height }) => (
          <div
            key={keyExtractor(item, index)}
            className="absolute left-0 right-0"
            style={{
              top: offset - (topPadding || 0),
              height,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Padding inférieur pour simuler les éléments non visibles */}
      {bottomPadding > 0 && (
        <div style={{ height: bottomPadding }} />
      )}

      {/* Footer collant */}
      {stickyFooter && (
        <div className="sticky bottom-0 z-10 bg-white shadow-sm border-t">
          {stickyFooter}
        </div>
      )}
    </div>
  );
}

// Hook pour utiliser facilement le virtual scrolling avec des données
export function useVirtualizedData<T>(
  data: T[],
  options: {
    itemHeight: number | ((item: T, index: number) => number);
    containerHeight: number;
    overscan?: number;
    onLoadMore?: () => void;
  }
) {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    onLoadMore
  } = options;

  return {
    items: data,
    itemHeight,
    containerHeight,
    overscan,
    onEndReached: onLoadMore
  };
}

// Composant optimisé pour les listes d'utilisateurs (cas d'usage fréquent)
interface OptimizedUserListProps {
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  }>;
  onUserClick?: (userId: string) => void;
  className?: string;
  height?: number;
}

export const OptimizedUserList: React.FC<OptimizedUserListProps> = ({
  users,
  onUserClick,
  className,
  height = 400
}) => {
  const renderUser = useCallback((user: typeof users[0], index: number) => (
    <div
      key={user.id}
      className={clsx(
        'flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
        onUserClick && 'cursor-pointer'
      )}
      onClick={() => onUserClick?.(user.id)}
    >
      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-gray-600">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
        {user.role && (
          <div className="text-xs text-gray-400 uppercase tracking-wide">{user.role}</div>
        )}
      </div>
    </div>
  ), [onUserClick]);

  if (users.length <= 20) {
    // Pour les petites listes, pas besoin de virtualisation
    return (
      <div className={clsx('overflow-auto', className)} style={{ height }}>
        {users.map((user, index) => renderUser(user, index))}
      </div>
    );
  }

  return (
    <VirtualizedList
      items={users}
      itemHeight={80} // Hauteur fixe pour les cartes utilisateur
      containerHeight={height}
      renderItem={renderUser}
      className={className}
      keyExtractor={(user) => user.id}
    />
  );
};

export default VirtualizedList;
