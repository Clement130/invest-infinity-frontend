import React, { useEffect } from 'react';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableWebVitals?: boolean;
  enableCustomMetrics?: boolean;
  enableResourceTiming?: boolean;
  enableNavigationTiming?: boolean;
  reportTo?: 'console' | 'analytics' | ((metric: any) => void);
  sampleRate?: number;
}

export default function PerformanceProvider({
  children,
  enableWebVitals = true,
  enableCustomMetrics = true,
  enableResourceTiming = false, // Désactivé par défaut pour éviter la surcharge
  enableNavigationTiming = true,
  reportTo = 'console',
  sampleRate = process.env.NODE_ENV === 'production' ? 0.1 : 1 // 10% en prod, 100% en dev
}: PerformanceProviderProps) {

  // Initialiser le monitoring des performances
  const { measureExecutionTime, measureInteraction, reportMetric } = usePerformanceMonitoring({
    enableWebVitals,
    enableCustomMetrics,
    enableResourceTiming,
    enableNavigationTiming,
    reportTo,
    sampleRate
  });

  // Mesurer le temps de démarrage de l'application
  useEffect(() => {
    const measureAppStart = () => {
      if (performance.timing) {
        const appStartTime = performance.now();
        reportMetric({
          name: 'app_initialization_time',
          value: appStartTime,
          timestamp: Date.now(),
          context: {
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        });
      }
    };

    // Mesurer après le premier rendu
    const timer = setTimeout(measureAppStart, 0);
    return () => clearTimeout(timer);
  }, [reportMetric]);

  // Exposer les méthodes de mesure globalement pour utilisation dans d'autres composants
  useEffect(() => {
    (window as any).performanceMonitor = {
      measureExecutionTime,
      measureInteraction,
      reportMetric
    };

    return () => {
      delete (window as any).performanceMonitor;
    };
  }, [measureExecutionTime, measureInteraction, reportMetric]);

  return <>{children}</>;
}
