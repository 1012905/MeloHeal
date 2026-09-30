// PWA 注册 —— 音愈时光 MeloHeal
// 由 index.html 以 <script type="module"> 引入（与 src/index.jsx 解耦）。
//
// 职责只有一件事：在「安全的浏览器环境」里注册 public/sw.js。
//   · Tauri 桌面端跳过：tauri:// 协议下没有 Service Worker，且不需要离线缓存；
//   · 非 https / 非 localhost 跳过：浏览器不允许在非安全上下文注册 SW；
//   · 注册路径用相对于当前页面 URL 的写法，GitHub Pages 子路径（/MeloHeal/）下同样正确；
//   · 任何失败都只 console 提示，绝不影响应用本身启动。

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const canRegister = typeof navigator !== 'undefined'
  && 'serviceWorker' in navigator
  && window.isSecureContext
  && !isTauri;

if (canRegister) {
  const register = () => {
    // document.baseURI = 页面地址；sw.js 与 index.html 同级 → 作用域即站点子目录
    const swUrl = new URL('sw.js', document.baseURI).href;
    navigator.serviceWorker
      .register(swUrl, { scope: './' })
      .then((registration) => {
        console.info('[pwa] Service Worker 已注册，作用域:', registration.scope);
        // 有新版本在等待时，提示刷新即可生效（不强制接管，避免打断正在编辑的表单）
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[pwa] 新版本已就绪，下次打开或刷新后生效');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[pwa] Service Worker 注册失败（不影响使用）:', err);
      });
  };

  // 等页面加载完再注册，避免和首屏渲染抢带宽
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
