import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// Gunakan app/App.tsx (entry point baru yang sudah direfactor)
// App.tsx lama di src/App.tsx dipertahankan sebagai backup Fase 1
import App from './app/App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
