import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  CreditCard,
  BarChart3,
  FileText,
  Eye,
  Target,
  Video,
  Settings,
  ArrowRight,
  Clock,
  X,
} from 'lucide-react';
import { searchCommandPalette, getRecentSearches, saveRecentSearch, type CommandPaletteItem } from '../../services/commandPaletteService';
import { useCommandPalette } from '../../hooks/useCommandPalette';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  CreditCard,
  BarChart3,
  FileText,
  Eye,
  Target,
  Video,
  Settings,
};

export default function CommandPalette() {
  const { isOpen, close, navigate } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ category: string; items: CommandPaletteItem[] }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const recentSearches = useMemo(() => getRecentSearches(), []);

  // Recherche avec debounce
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        try {
          const searchResults = await searchCommandPalette(query);
          setResults(searchResults);
          setSelectedIndex(0);
        } catch (error) {
          console.error('[CommandPalette] Erreur de recherche:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  // Focus sur l'input quand la palette s'ouvre
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Navigation au clavier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const allItems = results.flatMap((r) => r.items);
      const totalItems = allItems.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          handleSelectItem(allItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Scroll vers l'élément sélectionné
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectItem = (item: CommandPaletteItem) => {
    if (query.trim()) {
      saveRecentSearch(query);
    }

    if (item.path) {
      navigate(item.path);
      close();
    } else if (item.action) {
      item.action();
      close();
    }
  };

  const allItems = useMemo(() => results.flatMap((r) => r.items), [results]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Palette */}
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher ou naviguer... (Cmd+K)"
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            />
            <button
              onClick={close}
              className="p-1 rounded hover:bg-white/5 transition"
              title="Fermer (Esc)"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
                Recherche en cours...
              </div>
            ) : query.trim() && allItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                Aucun résultat trouvé
              </div>
            ) : query.trim() && allItems.length > 0 ? (
              <div className="py-2">
                {results.map((result, categoryIndex) => (
                  <div key={result.category} className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      {result.category}
                    </div>
                    {result.items.map((item, itemIndex) => {
                      const globalIndex = results
                        .slice(0, categoryIndex)
                        .reduce((sum, r) => sum + r.items.length, 0) + itemIndex;
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = item.icon ? iconMap[item.icon] : null;

                      return (
                        <button
                          key={item.id}
                          data-index={globalIndex}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                            isSelected
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {Icon ? (
                            <Icon className="w-5 h-5 flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.label}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {item.type === 'navigation' && (
                            <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mb-2">
                  Recherches récentes
                </div>
                {recentSearches.length > 0 ? (
                  recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-300 hover:bg-white/5 transition"
                    >
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{search}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Aucune recherche récente
                  </div>
                )}
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">
                  Navigation rapide
                </div>
                {results.length > 0 &&
                  results[0].items.slice(0, 5).map((item, index) => {
                    const Icon = item.icon ? iconMap[item.icon] : LayoutDashboard;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-300 hover:bg-white/5 transition"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">↑↓</kbd>
                Naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">↵</kbd>
                Sélectionner
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">Esc</kbd>
                Fermer
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

