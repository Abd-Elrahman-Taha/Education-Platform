import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Clean out all legacy mock caches and registries from localStorage so everything comes purely from backend
try {
  const keepKeys = new Set([
    'auth_token',
    'device_uuid',
    'theme',
    'syntax_theme',
    'syntax_current_user_v2',
    'syntax_active_view',
  ]);
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && !keepKeys.has(k)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
