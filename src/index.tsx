import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Pass a function to log results (e.g. reportWebVitals(console.log))
// or send to an analytics endpoint: https://bit.ly/CRA-vitals
reportWebVitals();

// Keep the service worker precache updated silently in the background without
// forcing mid-session full page reloads. Because index.html is excluded from
// precache and served NetworkFirst with no-cache headers, initial page loads
// already fetch the latest bundle directly from the network.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const checkForUpdates = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.update().catch(() => {});
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      checkForUpdates();
    }
  });

  setInterval(checkForUpdates, 10 * 60 * 1000);
}
