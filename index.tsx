import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Polyfill process for browser environments that don't have it defined
// Fixed: Access window.process via 'any' cast to avoid TypeScript property error
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: {} };
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);