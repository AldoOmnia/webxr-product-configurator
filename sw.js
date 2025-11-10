// Floyd Weekender 3D Configurator - Service Worker
// Advanced caching strategy for 3D models, textures, and app assets

// Production logging control
const isDevelopment = typeof self !== 'undefined' && (
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.search.includes('debug=true')
);

const log = (...args) => {
  if (isDevelopment) console.log(...args);
};

const warn = (...args) => {
  if (isDevelopment) console.warn(...args);
};

const error = (...args) => {
  // Always log errors, even in production
  console.error(...args);
};

const CACHE_VERSION = 'v2.0.2';
const CACHE_NAMES = {
  static: `floyd-weekender-static-${CACHE_VERSION}`,
  textures: `floyd-weekender-textures-${CACHE_VERSION}`,
  models: `floyd-weekender-models-${CACHE_VERSION}`,
  runtime: `floyd-weekender-runtime-${CACHE_VERSION}`
};

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.prod.html',
  '/src/XRUpgradeConfigurator.js',
  '/src/core/ConfiguratorEngine.js',
  '/src/config/xrupgrade-product.json',
  '/src/styles/main.css',
  '/src/styles/main.min.css',
  '/src/utils/Logger.js',
  '/src/utils/DeviceDetection.js',
  '/src/utils/HealthCheck.js',
  '/src/components/ui/ColorPicker.js',
  '/src/components/ui/StrapSelector.js',
  '/src/components/ui/EnvironmentSelector.js',
  '/src/components/ui/ActionButtons.js',
  '/src/components/mobile/MobileDock.js',
  '/assets/logo.svg',
  '/manifest.json'
];

// Large 3D model files (cache with special strategy)
const MODEL_ASSETS = [
  '/public/Weekender.glb'
];

// Texture files (cache aggressively)
const TEXTURE_PATTERNS = [
  /\/public\/assets\/.*\.(jpg|jpeg|png|webp)$/i,
  /\/public\/assets\/Weekender\/.*\.(jpg|jpeg|png|webp)$/i,
  /\/assets\/.*\.(jpg|jpeg|png|webp)$/i,
  /\/.*\.jpg$/i,
  /\/.*\.jpeg$/i,
  /\/.*\.png$/i,
  /\/.*\.webp$/i
];

// External CDN resources
const EXTERNAL_RESOURCES = [
  'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache critical assets
self.addEventListener('install', event => {
  log('🔧 Service Worker installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAMES.static).then(cache => {
        log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache external resources
      caches.open(CACHE_NAMES.static).then(cache => {
        log('🌐 Caching external resources...');
        return cache.addAll(EXTERNAL_RESOURCES);
      }),

      // Pre-cache 3D model (large file)
      caches.open(CACHE_NAMES.models).then(cache => {
        log('🎯 Pre-caching 3D model...');
        return cache.addAll(MODEL_ASSETS);
      })
    ]).then(() => {
      log('✅ Service Worker installed successfully');
      // Force activation
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  log('🚀 Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const validCaches = Object.values(CACHE_NAMES);
        return Promise.all(
          cacheNames
            .filter(cacheName => !validCaches.includes(cacheName))
            .map(cacheName => {
              log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),

      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      log('✅ Service Worker activated');
    })
  );
});

// Fetch event - sophisticated caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // Strategy 1: Static assets (Cache First)
    if (STATIC_ASSETS.some(asset => url.pathname === asset) ||
      EXTERNAL_RESOURCES.some(resource => request.url === resource)) {
      return await cacheFirst(request, CACHE_NAMES.static);
    }

    // Strategy 2: 3D Models (Cache First with streaming)
    if (MODEL_ASSETS.some(asset => url.pathname === asset)) {
      return await cacheFirstWithStreaming(request, CACHE_NAMES.models);
    }

    // Strategy 3: Textures (Cache First) - Enhanced with debugging
    const isTexture = TEXTURE_PATTERNS.some(pattern => pattern.test(url.pathname));
    if (isTexture) {
      log('🎨 Texture detected, caching:', url.pathname);
      return await cacheFirst(request, CACHE_NAMES.textures);
    }

    // Fallback: Catch any image files that might have been missed
    if (/\.(jpg|jpeg|png|webp|svg|gif)$/i.test(url.pathname)) {
      log('🖼️ Image file detected, caching as texture:', url.pathname);
      return await cacheFirst(request, CACHE_NAMES.textures);
    }

    // Strategy 4: API calls and dynamic content (Network First)
    if (url.pathname.includes('/api/') || url.pathname.endsWith('.json')) {
      return await networkFirst(request, CACHE_NAMES.runtime);
    }

    // Strategy 5: Everything else (Stale While Revalidate)
    return await staleWhileRevalidate(request, CACHE_NAMES.runtime);

  } catch (error) {
    error('❌ Fetch error:', error);
    return await handleOfflineFallback(request);
  }
}

// Cache First Strategy (for static assets)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    log('💾 Cache hit:', request.url);
    return cachedResponse;
  }

  log('🌐 Cache miss, fetching:', request.url);
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    log('✅ Caching successful:', request.url, 'in', cacheName);
    cache.put(request, networkResponse.clone());
  } else {
    warn('❌ Network response not ok:', networkResponse.status, request.url);
  }

  return networkResponse;
}

// Cache First with Streaming (for large 3D models)
async function cacheFirstWithStreaming(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    log('🎯 Model cache hit:', request.url);
    return cachedResponse;
  }

  log('📥 Downloading large model:', request.url);

  // For large files, we want to stream and cache simultaneously
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    // Clone for caching
    cache.put(request, networkResponse.clone());

    // Send progress updates to clients
    broadcastProgress(request.url, 'downloading');
  }

  return networkResponse;
}

// Network First Strategy (for dynamic content)
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    log('🔄 Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Always try to fetch in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignore network errors in background
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cache, wait for network
  return await fetchPromise;
}

// Offline fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);

  // For HTML requests, return cached index
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(CACHE_NAMES.static);
    return await cache.match('/') || new Response('Offline', { status: 503 });
  }

  // For images, return placeholder
  if (request.headers.get('accept')?.includes('image/')) {
    return new Response('', {
      status: 503,
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }

  // For everything else
  return new Response('Offline', { status: 503 });
}

// Broadcast progress to clients
function broadcastProgress(url, status) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_PROGRESS',
        url: url,
        status: status,
        timestamp: Date.now()
      });
    });
  });
}

// Handle messages from main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_TEXTURE':
      // Pre-cache specific texture
      cacheTexture(data.url);
      break;

    case 'CLEAR_CACHE':
      // Clear specific cache
      clearCache(data.cacheName);
      break;

    case 'GET_CACHE_STATUS':
      // Return cache status
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

// Helper: Cache specific texture
async function cacheTexture(url) {
  try {
    const cache = await caches.open(CACHE_NAMES.textures);
    await cache.add(url);
    log('✅ Texture cached:', url);
  } catch (error) {
    error('❌ Failed to cache texture:', url, error);
  }
}

// Helper: Clear specific cache
async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName);
    log('🗑️ Cache cleared:', cacheName);
  } catch (error) {
    error('❌ Failed to clear cache:', cacheName, error);
  }
}

// Helper: Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      size: keys.length,
      keys: keys.map(key => key.url)
    };
  }

  return status;
}

log('🎯 Floyd Weekender Service Worker loaded'); 