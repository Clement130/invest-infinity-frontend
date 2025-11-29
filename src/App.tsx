import { BrowserRouter as Router } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AppRouter from './app/router';
import TikTokPixel from './components/TiktokPixel';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Lazy load ChatBot pour améliorer les performances
const ChatBot = lazy(() => import('./components/ChatBot'));

export default function App() {
  return (
    <Router>
      <TikTokPixel />
      <AppRouter />
      <PWAInstallPrompt />
      <Suspense fallback={null}>
        <ChatBot />
      </Suspense>
    </Router>
  );
}