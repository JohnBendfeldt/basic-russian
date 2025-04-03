/// <reference types="react-scripts" />

declare module 'workbox-core';
declare module 'workbox-expiration';
declare module 'workbox-precaching';
declare module 'workbox-routing';
declare module 'workbox-strategies';

interface ServiceWorkerGlobalScope extends ServiceWorkerGlobalScope {
  __WB_MANIFEST: any;
}
