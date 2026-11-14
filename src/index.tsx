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
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  let pendingRefresh = false;
  // First visits start without a controller; claiming the page for the first time
  // must NOT trigger a reload mid-scroll (the initial load is already fresh).
  let hadController = Boolean(navigator.serviceWorker.controller);
  let lastInteractionAt = 0;

  const markInteraction = () => {
    lastInteractionAt = Date.now();
  };

  for (const eventName of ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const) {
    window.addEventListener(eventName, markInteraction, { passive: true });
  }

  const isUserActivelyInteracting = () => {
    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
    return isTyping || window.scrollY > 120 || Date.now() - lastInteractionAt < 4000;
  };

  const triggerReload = () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  };

  // 1. When a new service worker version replaces an existing controller, reload
  // once it is safe (never on initial first-visit claim or while scrolling/typing).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (isUserActivelyInteracting()) {
      pendingRefresh = true;
      return;
    }
    triggerReload();
  });

  const checkForUpdates = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.update().catch(() => {});
    });
  };

  // 2. iOS WebKit (Chrome on iPhone) thaws suspended tabs without a page reload.
  // Apply deferred updates when idle upon returning, otherwise check for updates.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (pendingRefresh && !isUserActivelyInteracting()) {
        triggerReload();
        return;
      }
      checkForUpdates();
    }
  });

  // 3. Apply any deferred update cleanly on history navigation
  window.addEventListener('popstate', () => {
    if (pendingRefresh) {
      triggerReload();
    }
  });

  // 4. iOS Back-Forward Cache (BFCache) restore check
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      checkForUpdates();
    }
  });

  // 5. Also check periodically while the tab is open (every 10 minutes)
  setInterval(checkForUpdates, 10 * 60 * 1000);
}
