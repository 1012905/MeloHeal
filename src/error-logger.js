// Global error logger — captures uncaught exceptions and unhandled rejections
// 同时通知 Tauri 后端记录日志（仅桌面端；Web 端优雅降级为纯 console）
//
// Web 解耦说明：Tauri 2 会在页面脚本执行前注入 window.__TAURI_INTERNALS__（Tauri 1 为
// window.__TAURI__）。浏览器 / GitHub Pages 下两者都不存在，因此这里在运行时探测环境：
// 非 Tauri 时既不加载 @tauri-apps/api/core，也不调用 invoke("log_error")，
// 只保留原有的 console.error 输出，桌面端行为完全不变。

/** 是否运行在 Tauri 容器内（模块加载时探测一次即可）。 */
const IS_TAURI = typeof window !== 'undefined'
  && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

function tryInvokeLog(msg) {
  if (!IS_TAURI) return; // Web：没有 Rust 端可写日志，静默跳过
  try {
    import("@tauri-apps/api/core").then(({ invoke }) => {
      invoke("log_error", { message: msg });
    }).catch(() => {});
  } catch {}
}

window.addEventListener('error', (event) => {
  const msg = event.error?.message || event.message;
  const stack = event.error?.stack || '';
  console.error('[Global Error]', msg, stack);
  tryInvokeLog(msg);
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || event.reason;
  const stack = event.reason?.stack || '';
  console.error('[Unhandled Rejection]', msg, stack);
  tryInvokeLog(String(msg));
});
