// ══ SERVICE WORKER — VinhPhat_App PWA ══
// Chiến lược: Cache-first cho static assets, Network-first cho API GAS

const CACHE_NAME = 'vp-app-v3';

// Assets cần cache ngay khi SW cài đặt
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './src/css/styles.css',
  './src/css/print.css',
  './src/js/app.js',
  './src/js/auth.js',
  './src/js/state.js',
  './src/js/config.js',
  './src/js/sync.js',
  './src/js/forms.js',
  './src/js/rolls.js',
  './src/js/xk-items.js',
  './src/js/phieu.js',
  './src/js/navigation.js',
  './src/js/init-events.js',
  './src/js/settings.js',
  './src/js/id-gen.js',
  './src/js/utils.js',
  './src/js/history.js',
  './src/js/tonkho.js',
  './src/js/baocao.js',
  './src/js/idb.js',
  './assets/images/icon.svg',
];

// ── Install: pre-cache core assets ──
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(function () {
        return self.skipWaiting();
      })
      .catch(function (err) {
        console.warn('[SW] Pre-cache failed (một số file có thể chưa tồn tại):', err);
        // Không block install nếu có file lỗi
        return self.skipWaiting();
      }),
  );
});

// ── Activate: xoá cache cũ ──
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

// ── Fetch: xử lý requests ──
self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);

  // Bỏ qua OPAQUE requests và non-GET
  if (event.request.method !== 'GET') return;

  // API Google Apps Script → Network-only (luôn cần mạng thật)
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleapis.com')) {
    // Không intercept — để browser xử lý bình thường
    return;
  }

  // Google Fonts → Network-first, fallback cache
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(networkFirstWithCache(event.request));
    return;
  }

  // CDN (Chart.js, v.v.) → Cache-first
  if (!url.hostname.includes('127.0.0.1') && !url.hostname.includes('localhost') && url.origin !== self.location.origin) {
    event.respondWith(cacheFirstWithNetwork(event.request));
    return;
  }

  // App assets (local) → Cache-first
  if (event.request.mode === 'navigate') {
    // Navigation requests → ưu tiên network để tránh giữ app shell cũ sau deploy
    event.respondWith(networkFirstPage(event.request));
    return;
  }

  event.respondWith(cacheFirstWithNetwork(event.request));
});

/** Cache-first: trả cache nếu có, nếu không fetch và cache lại */
function cacheFirstWithNetwork(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request)
      .then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, cloned);
          });
        }
        return response;
      })
      .catch(function () {
        // Không có mạng và không có cache → trả lỗi
        return new Response('Offline — không có kết nối mạng', { status: 503 });
      });
  });
}

/** Network-first: thử network trước, fallback cache */
function networkFirstWithCache(request) {
  return fetch(request)
    .then(function (response) {
      if (response && response.status === 200) {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, cloned);
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match(request);
    });
}

function networkFirstPage(request) {
  return fetch(request)
    .then(function (response) {
      if (response && response.status === 200 && response.type === 'basic') {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put('./index.html', cloned);
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match('./index.html').then(function (cached) {
        return cached || caches.match('./offline.html');
      });
    });
}
