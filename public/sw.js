/* ==========================================================================
   音愈时光 MeloHeal — Service Worker

   部署在站点根（GitHub Pages 子路径 https://1012905.github.io/MeloHeal/），
   内部一律使用「相对 Service Worker 自身」的路径，
   因此换到根域名 / 其他子路径都不需要改代码。

   策略：
     · install   预缓存 app shell（HTML/manifest/图标/自托管字体），逐个失败不阻断
     · navigate  network-first，离线回退缓存的 index.html
     · 其他同源  stale-while-revalidate（先给缓存，再后台更新）
     · activate  清理上一版本缓存 + clients.claim()

   ⚠ 发布新版本时请 bump 下面的 VERSION，否则浏览器不会更新旧缓存。
   ========================================================================== */

const VERSION = 'meloheal-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// app shell：应用是单文件产物，HTML 里内联了全部 JS/CSS，
// 其余就是 PWA 元数据、图标与自托管字体。
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './fonts/fonts.css',
  './fonts/inter-latin.woff2',
  './fonts/inter-latin-ext.woff2',
  './fonts/noto-sans-sc-subset.woff2',
];

// ── 预缓存 ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // 逐个缓存：某个资源 404 不应让整个 SW 安装失败（例如精简部署缺了某个字体）
    const results = await Promise.all(SHELL_ASSETS.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
        return true;
      } catch (err) {
        console.warn('[sw] 预缓存失败（已跳过）:', url, err);
        return false;
      }
    }));
    console.info(`[sw] ${VERSION} 已预缓存 ${results.filter(Boolean).length}/${results.length} 个资源`);
    await self.skipWaiting();
  })());
});

// ── 清理旧版本 + 立即接管 ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const stale = keys.filter((key) => !key.startsWith(VERSION));
    await Promise.all(stale.map((key) => caches.delete(key)));
    if (stale.length) console.info('[sw] 已清理旧缓存:', stale.join(', '));
    await self.clients.claim();
  })());
});

// ── 请求拦截 ──────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // 只接管同源资源；跨域（如用户从外部打开的歌单链接）一律直连
  if (url.origin !== self.location.origin) return;

  // 1) 页面导航：network-first，离线回退 shell
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put('./index.html', fresh.clone());
        }
        return fresh;
      } catch (err) {
        const cache = await caches.open(SHELL_CACHE);
        const fallback = (await cache.match('./index.html')) || (await cache.match('./'));
        if (fallback) return fallback;
        console.warn('[sw] 离线且无缓存副本:', err);
        return Response.error();
      }
    })());
    return;
  }

  // 2) 同源静态资源：stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);

    const network = fetch(request).then((response) => {
      // 只缓存正常的同源响应（跳过 opaque / 206 / 错误页）
      if (response && response.ok && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(network.then(() => undefined)); // 后台静默更新
      return cached;
    }

    const fresh = await network;
    if (fresh) return fresh;

    // 网络不可用：回退到 shell 缓存（字体、图标都在里面）
    const shell = await caches.open(SHELL_CACHE);
    const fallback = await shell.match(request);
    return fallback || Response.error();
  })());
});
