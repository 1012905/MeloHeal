import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { viteSingleFile } from "vite-plugin-singlefile";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // 测试（vitest）下关闭 solid-refresh HMR 运行时注入：它依赖 import.meta.hot 的虚拟模块，
  // 在测试环境里会解析失败，导致组件测试无法 import。
  plugins: [solid({ hot: !process.env.VITEST }), viteSingleFile()],
  clearScreen: false,

  build: {
    target: "es2021",
    minify: "esbuild",
    cssMinify: "lightningcss",
    rollupOptions: {
      cache: true,
    },
    assetsInlineLimit: 100000000, // Inline all assets
  },

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
