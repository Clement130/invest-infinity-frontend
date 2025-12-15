/**
 * ModulesFilters - Barre de recherche et filtres modernes
 * 
 * Features:
 * - Recherche avec animation focus
 * - Filtres avec animation au clic
 * - État sélectionné clairement visible
 * - Mobile: filtres en horizontal scroll smooth
 * - Compteur de modules filtrés
 * - Toggle vue grille/liste
 */

import { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid3X3, List, Clock, CheckCircle2, Play, X } from 'lucide-react';
import clsx from 'clsx';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type FilterKey = 'all' | 'in-progress' | 'completed' | 'not-started';
export type ViewMode = 'grid' | 'list';

interface FilterItem {
  key: FilterKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeColor: string;
}

const FILTERS: FilterItem[] = [
  { 
    key: 'all', 
    label: 'Tous', 
    icon: Grid3X3,
    color: 'text-gray-400 border-white/10 bg-white/5',
    activeColor: 'text-pink-300 border-pink-500/40 bg-pink-500/20'
  },
  { 
    key: 'in-progress', 
    label: 'En cours', 
    icon: Clock,
    color: 'text-gray-400 border-white/10 bg-white/5',
    activeColor: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/20'
  },
  { 
    key: 'completed', 
    label: 'Terminés', 
    icon: CheckCircle2,
    color: 'text-gray-400 border-white/10 bg-white/5',
    activeColor: 'text-green-300 border-green-500/40 bg-green-500/20'
  },
  { 
    key: 'not-started', 
    label: 'À démarrer', 
    icon: Play,
    color: 'text-gray-400 border-white/10 bg-white/5',
    activeColor: 'text-purple-300 border-purple-500/40 bg-purple-500/20'
  },
];

interface ModulesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filteredCount: number;
  totalCount: number;
}

function ModulesFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  filteredCount,
  totalCount,
}: ModulesFiltersProps) {
  const filtersScrollRef = useRef<HTMLDivElement>(null);
  const activeFilterRef = useRef<HTMLButtonElement>(null);

  // Scroll to active filter on mobile
  useEffect(() => {
    if (activeFilterRef.current && filtersScrollRef.current) {
      const container = filtersScrollRef.current;
      const activeButton = activeFilterRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [filter]);

  const hasActiveFilter = filter !== 'all' || search.length > 0;
  const { shouldReduceMotion } = useReducedMotion();
  
  return (
    <motion.section
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? {} : { delay: 0.3 }}
      className="space-y-4"
    >
      {/* Search & View Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
        {/* Search Input */}
        <div className="relative flex-1 w-full sm:max-w-xl group">
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-pink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un module..."
            className={clsx(
              'w-full rounded-xl border bg-white/5 py-3.5 pl-12 pr-12 text-white',
              'placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/40',
              'transition-all duration-300',
              'border-white/10 hover:border-white/20'
            )}
          />
          {/* Clear button */}
          <AnimatePresence>
            {search.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* View Mode Toggle - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 self-start">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange('grid')}
            className={clsx(
              'p-2.5 rounded-lg transition-all duration-200',
              viewMode === 'grid' 
                ? 'bg-pink-500/20 text-pink-400 shadow-lg shadow-pink-500/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Grid3X3 className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange('list')}
            className={clsx(
              'p-2.5 rounded-lg transition-all duration-200',
              viewMode === 'list' 
                ? 'bg-pink-500/20 text-pink-400 shadow-lg shadow-pink-500/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <List className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-2 sm:gap-3 w-full overflow-hidden">
        <Filter className="w-4 h-4 text-gray-500 flex-shrink-0 hidden sm:block" />
        
        {/* Filters - Horizontal scroll on mobile with padding for last item visibility */}
        <div 
          ref={filtersScrollRef}
          className={clsx(
            'flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide flex-1',
            'pb-1 -mb-1', // Hide scrollbar but keep scroll
            'snap-x snap-mandatory scroll-smooth',
            // Padding right pour que le dernier filtre soit visible
            'pr-4 sm:pr-0'
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FILTERS.map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.key;
            
            return (
              <motion.button
                key={item.key}
                ref={isActive ? activeFilterRef : null}
                onClick={() => onFilterChange(item.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={clsx(
                  // Mobile-first: padding plus compact, texte plus petit
                  'flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3',
                  'rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium',
                  'border transition-all duration-300 whitespace-nowrap snap-start',
                  'min-h-[44px] sm:min-h-[48px]', // Tap-friendly
                  isActive ? item.activeColor : item.color,
                  isActive && 'shadow-lg'
                )}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{item.label}</span>
                {/* Count badge for active filter */}
                {isActive && filter !== 'all' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-1 sm:px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] sm:text-xs font-bold"
                  >
                    {filteredCount}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Results count */}
        <AnimatePresence>
          {hasActiveFilter && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
            >
              <span className="text-sm text-gray-400">
                {filteredCount} / {totalCount} module{totalCount > 1 ? 's' : ''}
              </span>
              {hasActiveFilter && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    onFilterChange('all');
                  }}
                  className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: Results count below filters */}
      <AnimatePresence>
        {hasActiveFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex md:hidden items-center justify-between px-1"
          >
            <span className="text-sm text-gray-400">
              {filteredCount} module{filteredCount > 1 ? 's' : ''} trouvé{filteredCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => {
                onSearchChange('');
                onFilterChange('all');
              }}
              className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
            >
              Réinitialiser
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export default memo(ModulesFilters);

