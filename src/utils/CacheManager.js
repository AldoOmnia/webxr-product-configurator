import { Logger } from './Logger.js';

export class CacheManager {
  constructor() {
    this.serviceWorker = null;
    this.isSupported = 'serviceWorker' in navigator && 'caches' in window;
    this.cacheStatus = {
      static: { size: 0, ready: false },
      textures: { size: 0, ready: false },
      models: { size: 0, ready: false },
      runtime: { size: 0, ready: false }
    };

    this.eventListeners = new Map();

    if (this.isSupported) {
      this.initializeServiceWorker();
      this.setupMessageListener();
    }
  }

  async initializeServiceWorker() {
    try {
      if ('serviceWorker' in navigator) {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');

        Logger.info('✅ Service Worker registered:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          Logger.info('🔄 Service Worker update found');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              Logger.info('🆕 New Service Worker available');
              this.notifyListeners('updateAvailable', { registration });
            }
          });
        });

        // Get active service worker
        this.serviceWorker = registration.active || registration.waiting || registration.installing;

        // Update cache status
        await this.updateCacheStatus();

        return registration;
      }
    } catch (error) {
      Logger.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  }

  setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', event => {
      const { type, url, status, timestamp } = event.data;

      switch (type) {
        case 'CACHE_PROGRESS':
          this.notifyListeners('cacheProgress', { url, status, timestamp });
          break;
      }
    });
  }

  // Pre-cache specific texture
  async cacheTexture(url) {
    if (!this.isSupported) return false;

    try {
      // Send message to service worker
      if (this.serviceWorker) {
        this.serviceWorker.postMessage({
          type: 'CACHE_TEXTURE',
          data: { url }
        });
      }

      // Also add to browser cache directly
      const cache = await caches.open('floyd-weekender-textures-v2.0.2');
      await cache.add(url);

      Logger.info('✅ Texture cached:', url);
      await this.updateCacheStatus();
      return true;
    } catch (error) {
      Logger.error('❌ Failed to cache texture:', url, error);
      return false;
    }
  }

  // Pre-cache multiple textures
  async cacheTextures(urls) {
    if (!this.isSupported) return { success: 0, failed: 0 };

    const results = { success: 0, failed: 0 };

    for (const url of urls) {
      const success = await this.cacheTexture(url);
      if (success) {
        results.success++;
      } else {
        results.failed++;
      }

      // Small delay to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    Logger.info(`📊 Texture caching complete: ${results.success} success, ${results.failed} failed`);
    return results;
  }

  // Get cache status
  async getCacheStatus() {
    if (!this.isSupported) return null;

    try {
      const cacheNames = await caches.keys();
      const status = {};

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        // Categorize cache
        let category = 'runtime';
        if (cacheName.includes('static')) category = 'static';
        else if (cacheName.includes('textures')) category = 'textures';
        else if (cacheName.includes('models')) category = 'models';

        status[category] = {
          name: cacheName,
          size: keys.length,
          ready: keys.length > 0,
          keys: keys.map(key => key.url)
        };
      }

      this.cacheStatus = status;
      return status;
    } catch (error) {
      Logger.error('❌ Failed to get cache status:', error);
      return null;
    }
  }

  // Update cache status
  async updateCacheStatus() {
    const status = await this.getCacheStatus();
    if (status) {
      this.notifyListeners('cacheStatusUpdated', status);
    }
    return status;
  }

  // Clear specific cache
  async clearCache(type = 'all') {
    if (!this.isSupported) return false;

    try {
      const cacheNames = await caches.keys();

      if (type === 'all') {
        // Clear all caches
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        Logger.info('🗑️ All caches cleared');
      } else {
        // Clear specific cache type
        const targetCaches = cacheNames.filter(name => name.includes(type));
        await Promise.all(targetCaches.map(name => caches.delete(name)));
        Logger.info(`🗑️ ${type} caches cleared`);
      }

      await this.updateCacheStatus();
      return true;
    } catch (error) {
      Logger.error('❌ Failed to clear cache:', error);
      return false;
    }
  }

  // Check if resource is cached
  async isCached(url) {
    if (!this.isSupported) return false;

    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const response = await cache.match(url);
        if (response) {
          return { cached: true, cacheName };
        }
      }

      return { cached: false };
    } catch (error) {
      Logger.error('❌ Failed to check cache:', error);
      return { cached: false };
    }
  }

  // Get cache size in bytes (estimate)
  async getCacheSize() {
    if (!this.isSupported) return 0;

    try {
      let totalSize = 0;
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          const response = await cache.match(request);
          if (response && response.headers.get('content-length')) {
            totalSize += parseInt(response.headers.get('content-length'));
          }
        }
      }

      return totalSize;
    } catch (error) {
      Logger.error('❌ Failed to calculate cache size:', error);
      return 0;
    }
  }

  // Format cache size for display
  formatCacheSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Force service worker update
  async updateServiceWorker() {
    if (!this.isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        Logger.info('🔄 Service Worker update triggered');
        return true;
      }
      return false;
    } catch (error) {
      Logger.error('❌ Failed to update Service Worker:', error);
      return false;
    }
  }

  // Skip waiting for new service worker
  skipWaiting() {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          Logger.error(`❌ Error in cache event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get cache statistics for debugging
  async getDebugInfo() {
    const status = await this.getCacheStatus();
    const size = await this.getCacheSize();

    return {
      supported: this.isSupported,
      serviceWorkerActive: !!this.serviceWorker,
      cacheStatus: status,
      totalSize: this.formatCacheSize(size),
      totalSizeBytes: size
    };
  }
} 