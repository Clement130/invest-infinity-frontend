import { useEffect, useCallback } from 'react';

// Types pour les métriques Web Vitals
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache';
}

// Types pour les métriques personnalisées
export interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

// Configuration du monitoring
interface PerformanceConfig {
  enableWebVitals?: boolean;
  enableCustomMetrics?: boolean;
  enableResourceTiming?: boolean;
  enableNavigationTiming?: boolean;
  reportTo?: 'console' | 'analytics' | 'monitoring-service' | ((metric: WebVitalsMetric | CustomMetric) => void);
  sampleRate?: number; // 0-1, pour échantillonnage
}

// Hook pour mesurer les Web Vitals
export function useWebVitals(config: PerformanceConfig = {}) {
  const {
    enableWebVitals = true,
    reportTo = 'console',
    sampleRate = 1
  } = config;

  const reportMetric = useCallback((metric: WebVitalsMetric | CustomMetric) => {
    // Échantillonnage
    if (Math.random() > sampleRate) return;

    switch (reportTo) {
      case 'console':
        console.log(`[Performance] ${metric.name}:`, metric);
        break;
      case 'analytics':
        // Envoyer à Google Analytics, Mixpanel, etc.
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'web_vitals', {
            custom_map: { metric_value: metric.value },
            event_category: 'Web Vitals',
            event_label: metric.name,
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)
          });
        }
        break;
      default:
        if (typeof reportTo === 'function') {
          reportTo(metric);
        }
        break;
    }
  }, [reportTo, sampleRate]);

  useEffect(() => {
    if (!enableWebVitals || typeof window === 'undefined') return;

    // Importer dynamiquement web-vitals pour éviter les erreurs de build
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Cumulative Layout Shift
      getCLS((metric) => {
        reportMetric({
          name: 'CLS',
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          rating: metric.rating,
          navigationType: metric.navigationType
        });
      });

      // First Input Delay
      getFID((metric) => {
        reportMetric({
          name: 'FID',
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          rating: metric.rating,
          navigationType: metric.navigationType
        });
      });

      // First Contentful Paint
      getFCP((metric) => {
        reportMetric({
          name: 'FCP',
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          rating: metric.rating,
          navigationType: metric.navigationType
        });
      });

      // Largest Contentful Paint
      getLCP((metric) => {
        reportMetric({
          name: 'LCP',
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          rating: metric.rating,
          navigationType: metric.navigationType
        });
      });

      // Time to First Byte
      getTTFB((metric) => {
        reportMetric({
          name: 'TTFB',
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          rating: metric.rating,
          navigationType: metric.navigationType
        });
      });
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error);
    });
  }, [enableWebVitals, reportMetric]);

  return { reportMetric };
}

// Hook pour mesurer des métriques personnalisées
export function useCustomMetrics(config: PerformanceConfig = {}) {
  const {
    enableCustomMetrics = true,
    reportTo = 'console',
    sampleRate = 1
  } = config;

  const reportMetric = useCallback((metric: CustomMetric) => {
    if (!enableCustomMetrics) return;
    if (Math.random() > sampleRate) return;

    switch (reportTo) {
      case 'console':
        console.log(`[Custom Metric] ${metric.name}:`, metric);
        break;
      case 'analytics':
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'custom_metric', {
            event_category: 'Performance',
            event_label: metric.name,
            value: Math.round(metric.value),
            custom_map: { metric_context: JSON.stringify(metric.context) }
          });
        }
        break;
      default:
        if (typeof reportTo === 'function') {
          reportTo(metric);
        }
        break;
    }
  }, [enableCustomMetrics, reportTo, sampleRate]);

  // Mesurer le temps d'exécution d'une fonction
  const measureExecutionTime = useCallback(<T>(
    name: string,
    fn: () => T | Promise<T>,
    context?: Record<string, any>
  ): T | Promise<T> => {
    const startTime = performance.now();

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result.finally(() => {
          const endTime = performance.now();
          reportMetric({
            name,
            value: endTime - startTime,
            timestamp: Date.now(),
            context
          });
        });
      } else {
        const endTime = performance.now();
        reportMetric({
          name,
          value: endTime - startTime,
          timestamp: Date.now(),
          context
        });
        return result;
      }
    } catch (error) {
      const endTime = performance.now();
      reportMetric({
        name: `${name}_error`,
        value: endTime - startTime,
        timestamp: Date.now(),
        context: { ...context, error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }
  }, [reportMetric]);

  // Mesurer les interactions utilisateur
  const measureInteraction = useCallback((
    elementId: string,
    interactionType: 'click' | 'hover' | 'focus' | 'blur',
    context?: Record<string, any>
  ) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const handler = () => {
      reportMetric({
        name: `interaction_${interactionType}`,
        value: 1,
        timestamp: Date.now(),
        context: { ...context, elementId, interactionType }
      });
    };

    element.addEventListener(interactionType, handler, { once: true });
  }, [reportMetric]);

  return {
    reportMetric,
    measureExecutionTime,
    measureInteraction
  };
}

// Hook pour mesurer les ressources
export function useResourceTiming(config: PerformanceConfig = {}) {
  const {
    enableResourceTiming = true,
    reportTo = 'console',
    sampleRate = 0.1 // Seulement 10% des chargements pour éviter la surcharge
  } = config;

  useEffect(() => {
    if (!enableResourceTiming || typeof window === 'undefined') return;

    const reportMetric = (metric: CustomMetric) => {
      if (Math.random() > sampleRate) return;

      switch (reportTo) {
        case 'console':
          console.log(`[Resource Timing] ${metric.name}:`, metric);
          break;
        case 'analytics':
          if ((window as any).gtag) {
            (window as any).gtag('event', 'resource_timing', {
              event_category: 'Performance',
              event_label: metric.name,
              value: Math.round(metric.value)
            });
          }
          break;
        default:
          if (typeof reportTo === 'function') {
            reportTo(metric);
          }
          break;
      }
    };

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Seulement les ressources importantes
          if (resourceEntry.duration > 100) { // Plus de 100ms
            reportMetric({
              name: `resource_${resourceEntry.name.split('/').pop()?.split('?')[0] || 'unknown'}`,
              value: resourceEntry.duration,
              timestamp: Date.now(),
              context: {
                type: resourceEntry.initiatorType,
                size: resourceEntry.transferSize,
                cached: resourceEntry.transferSize === 0
              }
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, [enableResourceTiming, reportTo, sampleRate]);
}

// Hook pour mesurer la navigation
export function useNavigationTiming(config: PerformanceConfig = {}) {
  const {
    enableNavigationTiming = true,
    reportTo = 'console'
  } = config;

  useEffect(() => {
    if (!enableNavigationTiming || typeof window === 'undefined') return;

    const reportMetric = (metric: CustomMetric) => {
      switch (reportTo) {
        case 'console':
          console.log(`[Navigation Timing] ${metric.name}:`, metric);
          break;
        case 'analytics':
          if ((window as any).gtag) {
            (window as any).gtag('event', 'navigation_timing', {
              event_category: 'Performance',
              event_label: metric.name,
              value: Math.round(metric.value)
            });
          }
          break;
        default:
          if (typeof reportTo === 'function') {
            reportTo(metric);
          }
          break;
      }
    };

    // Mesurer après le chargement de la page
    const measureNavigation = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        const metrics = [
          { name: 'dom_content_loaded', value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart },
          { name: 'dom_interactive', value: navigation.domInteractive - navigation.fetchStart },
          { name: 'dom_complete', value: navigation.domComplete - navigation.fetchStart },
          { name: 'load_complete', value: navigation.loadEventEnd - navigation.loadEventStart }
        ];

        metrics.forEach(({ name, value }) => {
          if (value > 0) {
            reportMetric({
              name: `navigation_${name}`,
              value,
              timestamp: Date.now(),
              context: {
                type: navigation.type,
                redirectCount: navigation.redirectCount
              }
            });
          }
        });
      }
    };

    if (document.readyState === 'complete') {
      measureNavigation();
    } else {
      window.addEventListener('load', measureNavigation, { once: true });
    }
  }, [enableNavigationTiming, reportTo]);
}

// Hook principal qui combine tout
export function usePerformanceMonitoring(config: PerformanceConfig = {}) {
  useWebVitals(config);
  useCustomMetrics(config);
  useResourceTiming(config);
  useNavigationTiming(config);

  return {
    // Méthodes pour mesurer manuellement
    measureExecutionTime: useCustomMetrics(config).measureExecutionTime,
    measureInteraction: useCustomMetrics(config).measureInteraction,
    reportMetric: useCustomMetrics(config).reportMetric
  };
}

// Fonction utilitaire pour mesurer les performances d'un composant
export function measureComponentPerformance(componentName: string) {
  const { measureExecutionTime } = useCustomMetrics();

  return {
    measureRender: (callback: () => void) => {
      return measureExecutionTime(`${componentName}_render`, callback);
    }
  };
}
