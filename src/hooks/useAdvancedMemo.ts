import { useCallback, useMemo, useRef, useEffect } from 'react';

// Hook pour memoization avancée de callbacks avec dépendances profondes
export function useAdvancedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options?: {
    deepCompare?: boolean;
    debounceMs?: number;
  }
): T {
  const { deepCompare = false, debounceMs } = options || {};
  const depsRef = useRef<React.DependencyList>();
  const callbackRef = useRef<T>();

  // Comparaison profonde des dépendances si demandé
  const depsChanged = useMemo(() => {
    if (!deepCompare) return true;

    if (!depsRef.current || depsRef.current.length !== deps.length) {
      return true;
    }

    return deps.some((dep, index) => {
      const prevDep = depsRef.current![index];
      return !Object.is(dep, prevDep);
    });
  }, [deps, deepCompare]);

  // Debounce si demandé
  const debouncedCallback = useMemo(() => {
    if (!debounceMs) return callback;

    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), debounceMs);
    }) as T;
  }, [callback, debounceMs]);

  return useCallback(debouncedCallback, depsChanged ? deps : []);
}

// Hook pour memoization de valeurs calculées coûteuses
export function useAdvancedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options?: {
    deepCompare?: boolean;
    maxAge?: number; // Cache avec expiration
  }
): T {
  const { deepCompare = false, maxAge } = options || {};
  const cacheRef = useRef<{ value: T; deps: React.DependencyList; timestamp: number }>();

  return useMemo(() => {
    const now = Date.now();

    // Vérifier si le cache est valide
    if (cacheRef.current) {
      const { deps: cachedDeps, timestamp } = cacheRef.current;

      // Vérifier expiration
      if (maxAge && now - timestamp > maxAge) {
        // Cache expiré, recalculer
      } else if (!deepCompare && deps.length === cachedDeps.length &&
                 deps.every((dep, index) => Object.is(dep, cachedDeps[index]))) {
        // Dépendances identiques, retourner cache
        return cacheRef.current.value;
      } else if (deepCompare) {
        // Comparaison profonde
        const depsEqual = deps.length === cachedDeps.length &&
          deps.every((dep, index) => Object.is(dep, cachedDeps[index]));

        if (depsEqual) {
          return cacheRef.current.value;
        }
      }
    }

    // Calculer et mettre en cache
    const value = factory();
    cacheRef.current = { value, deps: [...deps], timestamp: now };

    return value;
  }, deps);
}

// Hook pour éviter les re-renders inutiles de composants
export function useStableProps<T extends Record<string, any>>(props: T): T {
  const propsRef = useRef<T>();

  return useMemo(() => {
    // Comparer les props superficiellement
    if (!propsRef.current) {
      propsRef.current = props;
      return props;
    }

    const currentProps = propsRef.current;
    const keys = Object.keys(props);

    // Vérifier si les props ont changé
    const hasChanged = keys.some(key => !Object.is(currentProps[key], props[key]));

    if (hasChanged) {
      propsRef.current = props;
      return props;
    }

    return currentProps;
  }, [props]);
}

// Hook pour optimiser les event handlers
export function useEventHandler<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    debounce?: number;
    throttle?: number;
  }
): T {
  const { debounce, throttle } = options || {};
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastCallRef = useRef<number>(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (throttle) {
      if (now - lastCallRef.current >= throttle) {
        lastCallRef.current = now;
        return handler(...args);
      }
      return;
    }

    if (debounce) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => handler(...args), debounce);
      return;
    }

    return handler(...args);
  }, [handler, debounce, throttle]) as T;
}

// Hook pour memoization conditionnelle
export function useConditionalMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  condition: boolean
): T | undefined {
  const resultRef = useRef<T>();

  return useMemo(() => {
    if (!condition) return resultRef.current;

    const result = factory();
    resultRef.current = result;
    return result;
  }, condition ? deps : []);
}

// Hook pour éviter les calculs coûteux lors du premier render
export function useDeferredMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  delay: number = 0
): T | undefined {
  const [isReady, setIsReady] = React.useState(delay === 0);
  const resultRef = useRef<T>();

  useEffect(() => {
    if (delay === 0) return;

    const timer = setTimeout(() => setIsReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return useMemo(() => {
    if (!isReady) return resultRef.current;

    const result = factory();
    resultRef.current = result;
    return result;
  }, isReady ? deps : []);
}

// Utilitaire pour comparer des objets profondément (pour memoization)
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => deepEqual(val, b[index]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => keysB.includes(key) && deepEqual(a[key], b[key]));
  }

  return false;
}
