# MeloHeal (音愈时光) — 歌曲管理桌面应用

Solid.js + Vite 6 + Tauri 2 跨平台歌曲管理应用。纯本地（localStorage），无后端。

## Commands

| 作用 | 命令 |
|------|------|
| 安装依赖 | `npm install` |
| Vite 前端开发 | `npm run dev` (端口 1420) |
| Tauri 桌面开发 | `npm run tauri dev` |
| 构建前端 | `npm run build` (输出到 dist/) |
| 构建桌面安装包 | `npm run tauri build` |
| 前端测试 | `npm test` (vitest) |
| Rust 测试 | `cd src-tauri && cargo test` |

## Architecture

- **`src/index.jsx`** — 入口，`render(<App />, #root)`
- **`src/App.jsx`** — 主组件：路由、全部信号状态、Tab 切换、快捷键处理
- **`src/components/`** — 按标签页划分的 UI 组件：TabSongs / TabPlaylists / TabRandom / TabStats / TabSettings / SongFormModal / Header / Skeleton
- **`src/hooks/useSongStore.js`** — 响应式数据层，封装 localStorage CRUD（歌曲、歌单、最近选中、回收站）
- **`src/lib/songs.js`** — 纯函数工具：标题归一化、解析、去重、语言检测、模糊匹配
- **`src/lib/i18n.js`** + `locales/` — 国际化（zh/en）
- **`src/styles/tokens.css`** — 设计 Tokens（间距/字号/颜色），CSS 自定义属性主题系统（pink/blue/green/purple）
- **`src-tauri/src/main.rs`** — Rust 入口，委托给 `lib.rs` 的 `run()`
- **`src-tauri/src/lib.rs`** — Tauri 命令：读曲库文件、开关自动处理、日志接口；autostart 插件
- **`src-tauri/tauri.conf.json`** — 窗口 860×780 (min 380×560)，打包 NSIS/MSI/DMG

## Conventions

- **文件扩展名**：组件用 `.jsx`，工具库用 `.js`
- **Solid.js 模式**：全部状态用 `createSignal`/`createEffect`，条件渲染用 `<Show>`，列表用 `<For>`，懒加载用 `lazy`+`<Suspense>`
- **Props 传递**：父组件持所有信号，通过 props 下传；Tab 共享数据通过 `tabCtx` 对象
- **CSS**：kebab-case 类名（`glass-panel`, `toolbar-row`），CSS 自定义属性做主题，主题类名 `theme-pink`/`theme-blue`/`theme-green`/`theme-purple`，暗色模式 `data-theme="dark"`
- **国际化**：`t(lang(), "key")` 调用，locales 文件 keys 统一
- **localStorage keys** 统一 `mh-` 前缀（`mh-songs`, `mh-playlists`, `mh-dark`, `mh-theme`, `mh-lang`）
- **Rust 后端**：serde JSON 序列化，tracing 日志，单元测试在 `#[cfg(test)] mod tests`
- **注释语言**：中文注释
- **导入**：ES modules，带 `.js`/`.jsx` 后缀

## Notes

（留空供后续添加）
