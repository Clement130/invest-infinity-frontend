import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './app/router';
import TikTokPixel from './components/TiktokPixel';
import ChatBot from './components/ChatBot';

export default function App() {
  return (
    <Router>
      <TikTokPixel />
      <AppRouter />
      <ChatBot />
    </Router>
  );
}