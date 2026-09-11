import { appLogger } from './logger';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        appLogger.info(`ServiceWorker registered: ${registration.scope}`);
      })
      .catch((error) => {
        appLogger.error('ServiceWorker注册失败', error);
      });
  });
}
