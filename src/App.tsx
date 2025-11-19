import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './app/router';
import TikTokPixel from './components/TiktokPixel';

export default function App() {
  return (
    <Router>
      <TikTokPixel />
      <AppRouter />
    </Router>
  );
}