import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './app/router';
import TikTokPixel from './components/TiktokPixel';
import PWAInstallPrompt from './components/PWAInstallPrompt';

export default function App() {
  return (
    <Router>
      <TikTokPixel />
      <AppRouter />
      <PWAInstallPrompt />
    </Router>
  );
}