import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {firebaseInitError} from './firebase.ts';
import './index.css';

// The PWA service worker uses a cache-first strategy, which is great for
// production offline support but actively harmful during development: it
// would freeze the app on whatever version was cached on first load and
// silently ignore every subsequent code change. Only register it for real
// production builds, and actively clean up any worker/cache left over from
// an earlier dev session so a stale one can't keep haunting the page.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
        .catch((err) => console.error('Service Worker registration failed:', err));
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }
}

function FirebaseConfigError({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 560, border: '1px solid #f87171', borderRadius: 12, padding: 24, background: '#1e1b1b' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: 18, color: '#f87171' }}>Firebase configuration error</h1>
        <p style={{ margin: '0 0 12px', lineHeight: 1.5 }}>{message}</p>
        <p style={{ margin: 0, lineHeight: 1.5, color: '#94a3b8', fontSize: 14 }}>
          Copy <code>.env.example</code> to <code>.env</code>, fill in your Firebase project's
          SDK config (Firebase Console → Project Settings → General → Your apps), then restart
          the dev server.
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {firebaseInitError ? <FirebaseConfigError message={firebaseInitError} /> : <App />}
  </StrictMode>,
);
