/// <reference lib="webworker" />

// This adds proper typing for the service worker environment
declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{
      url: string;
      revision: string | null;
    }>;
  }
}

export {};
