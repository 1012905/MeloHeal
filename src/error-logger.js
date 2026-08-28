// Global error logger — captures uncaught exceptions and unhandled rejections
// 同时通知 Tauri 后端记录日志
function tryInvokeLog(msg) {
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
