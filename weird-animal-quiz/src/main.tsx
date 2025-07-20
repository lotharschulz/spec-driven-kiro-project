import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initializeSecurity } from './utils/security';
import { registerServiceWorker } from './utils/serviceWorker';

// Initialize security measures before rendering the app
initializeSecurity();

// Register service worker for offline functionality
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
