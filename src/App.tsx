import { BrowserRouter as Router } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AppRouter from './app/router';
import TikTokPixel from './components/TiktokPixel';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PerformanceProvider from './components/PerformanceProvider';

// Lazy load ChatBot pour améliorer les performances
const ChatBot = lazy(() => import('./components/ChatBot'));

export default function App() {
  return (
    <PerformanceProvider
      enableWebVitals={true}
      enableCustomMetrics={true}
      enableResourceTiming={false}
      enableNavigationTiming={true}
      reportTo="console"
      sampleRate={process.env.NODE_ENV === 'production' ? 0.1 : 1}
    >
      <Router>
        <TikTokPixel />
        <AppRouter />
        <PWAInstallPrompt />
        <Suspense fallback={null}>
          <ChatBot />
        </Suspense>
      </Router>
    </PerformanceProvider>
  );
}