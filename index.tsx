import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Robust Polyfill for process.env in the browser
// We use globalThis to ensure it's accessible across all module boundaries
const globalObj = (typeof globalThis !== 'undefined' ? globalThis : window) as any;

if (!globalObj.process) {
  globalObj.process = { env: {} };
} else if (!globalObj.process.env) {
  globalObj.process.env = {};
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