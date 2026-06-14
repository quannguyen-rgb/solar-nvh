// Service Worker — Solar NamVietHung PWA
// Phiên bản cache: tăng số này mỗi khi deploy bản mới
const CACHE_NAME = 'solar-nvh-v1';

// Các file cần cache để dùng offline
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Cài đặt: cache tất cả assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching assets...');
      // Cache từng file, bỏ qua lỗi (xlsx CDN có thể offline)
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Kích hoạt: xóa cache cũ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first (ưu tiên cache, fallback về network)
self.addEventListener('fetch', event => {
  // Chỉ xử lý GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // Không có trong cache → thử network
      return fetch(event.request).then(response => {
        // Lưu vào cache nếu thành công
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Hoàn toàn offline và không có cache → trả về trang chính
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
