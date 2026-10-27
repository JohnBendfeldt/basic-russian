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

// ==============================================================================
// Service Worker Lifecycle & iOS WebKit (Chrome/Safari on iPhone) Update Manager
// ==============================================================================
if ('serviceWorker' in navigator) {
  let refreshing = false;

  // 1. When a new service worker version activates, reload page immediately so
  // users run the newly deployed code without zombie caching states.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  const checkForUpdates = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.update().catch(() => {});
    });
  };

  // 2. iOS WebKit (Chrome on iPhone) thaws suspended tabs without a page reload.
  // Check for updates whenever the user switches back to Chrome on iOS or unlocks their phone.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });

  // 3. iOS Back-Forward Cache (BFCache) restore check
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      checkForUpdates();
    }
  });

  // 4. Also check periodically while the tab is open (every 10 minutes)
  setInterval(checkForUpdates, 10 * 60 * 1000);
}
