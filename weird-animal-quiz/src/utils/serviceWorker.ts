/**
 * Service Worker registration and management
 * Handles offline functionality and caching
 */

/**
 * Register service worker for offline functionality
 */
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify user
            console.log('New content available, please refresh');
          }
        });
      }
    });

  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('Service Worker unregistered');
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
}

/**
 * Send message to service worker
 */
export function sendMessageToServiceWorker(message: any): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Listen for service worker messages
 */
export function listenForServiceWorkerMessages(callback: (event: MessageEvent) => void): void {
  navigator.serviceWorker?.addEventListener('message', callback);
}