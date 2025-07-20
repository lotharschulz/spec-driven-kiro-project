/**
 * Offline functionality manager
 * Handles service worker registration, caching, and offline state
 */

export interface OfflineState {
  isOnline: boolean;
  isServiceWorkerSupported: boolean;
  isServiceWorkerRegistered: boolean;
  cacheStatus: 'loading' | 'ready' | 'error';
}

export class OfflineManager {
  private static instance: OfflineManager;
  private state: OfflineState = {
    isOnline: navigator.onLine,
    isServiceWorkerSupported: 'serviceWorker' in navigator,
    isServiceWorkerRegistered: false,
    cacheStatus: 'loading'
  };
  private listeners: ((state: OfflineState) => void)[] = [];
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {
    this.setupEventListeners();
    this.initializeServiceWorker();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Get current offline state
   */
  getState(): OfflineState {
    return { ...this.state };
  }

  /**
   * Subscribe to offline state changes
   */
  subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Initialize service worker
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!this.state.isServiceWorkerSupported) {
      console.warn('Service Worker not supported');
      this.updateState({ cacheStatus: 'error' });
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');
      
      this.updateState({ 
        isServiceWorkerRegistered: true,
        cacheStatus: 'ready'
      });

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        this.handleServiceWorkerUpdate();
      });

      // Check if there's a waiting service worker
      if (this.registration.waiting) {
        this.handleServiceWorkerUpdate();
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.updateState({ cacheStatus: 'error' });
    }
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdate(): void {
    if (!this.registration?.waiting) return;

    const newWorker = this.registration.waiting;
    
    // Show update notification to user
    this.notifyUpdate(() => {
      newWorker.postMessage({ action: 'skipWaiting' });
    });

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'activated') {
        window.location.reload();
      }
    });
  }

  /**
   * Notify user about available update
   */
  private notifyUpdate(acceptUpdate: () => void): void {
    // In a real app, this would show a user-friendly update notification
    if (confirm('A new version is available. Update now?')) {
      acceptUpdate();
    }
  }

  /**
   * Setup event listeners for online/offline detection
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('App is online');
      this.updateState({ isOnline: true });
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.updateState({ isOnline: false });
    });

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload);
        break;
      case 'OFFLINE_READY':
        console.log('App ready for offline use');
        this.updateState({ cacheStatus: 'ready' });
        break;
      default:
        console.log('Unknown service worker message:', event.data);
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<OfflineState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Manually check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('Checked for service worker updates');
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  /**
   * Clear all caches (for debugging/reset)
   */
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  /**
   * Get cache storage info
   */
  async getCacheInfo(): Promise<{
    cacheNames: string[];
    totalSize: number;
  }> {
    if (!('caches' in window)) {
      return { cacheNames: [], totalSize: 0 };
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return { cacheNames, totalSize };
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return { cacheNames: [], totalSize: 0 };
    }
  }
}

// React hook for using offline manager
export function useOfflineManager() {
  const [state, setState] = React.useState<OfflineState>(() => 
    OfflineManager.getInstance().getState()
  );

  React.useEffect(() => {
    const manager = OfflineManager.getInstance();
    const unsubscribe = manager.subscribe(setState);
    
    return unsubscribe;
  }, []);

  const manager = React.useMemo(() => OfflineManager.getInstance(), []);

  return {
    ...state,
    checkForUpdates: () => manager.checkForUpdates(),
    clearCaches: () => manager.clearCaches(),
    getCacheInfo: () => manager.getCacheInfo()
  };
}

// Offline storage utilities
export class OfflineStorage {
  private static readonly OFFLINE_KEY = 'quiz-offline-data';

  /**
   * Store data for offline use
   */
  static store(key: string, data: any): void {
    try {
      const offlineData = this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: Date.now(),
        version: 1
      };
      
      localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  /**
   * Retrieve offline data
   */
  static retrieve<T>(key: string): T | null {
    try {
      const offlineData = this.getOfflineData();
      const item = offlineData[key];
      
      if (!item) return null;
      
      // Check if data is too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - item.timestamp > maxAge) {
        delete offlineData[key];
        localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(offlineData));
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      return null;
    }
  }

  /**
   * Clear offline data
   */
  static clear(key?: string): void {
    try {
      if (key) {
        const offlineData = this.getOfflineData();
        delete offlineData[key];
        localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(offlineData));
      } else {
        localStorage.removeItem(this.OFFLINE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  /**
   * Get all offline data
   */
  private static getOfflineData(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.OFFLINE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to parse offline data:', error);
      return {};
    }
  }
}

// Import React for the hook
import React from 'react';