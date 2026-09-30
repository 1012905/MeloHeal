# 🎵 音愈时光 — MeloHeal

**歌曲管理 · 歌单 · 随机选歌 · 数据统计**

[![在线体验](https://img.shields.io/badge/在线体验-1012905.github.io%2FMeloHeal-5B4B8A?style=flat-square&logo=githubpages&logoColor=white)](https://1012905.github.io/MeloHeal/)
[![PWA](https://img.shields.io/badge/PWA-可安装·离线可用-FF7A6B?style=flat-square)](#-pwa-安装与离线)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-5B4B8A?style=flat-square)](LICENSE)
[![Solid.js](https://img.shields.io/badge/Solid.js-1.9-2C4F7C?style=flat-square)](https://www.solidjs.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?style=flat-square&logo=tauri&logoColor=white)](https://v2.tauri.app/)

> 一款**纯本地**的歌曲管理应用：整理你的私人歌单、看分类与语言分布、想不出听什么时让它随机挑一首。
> 数据只存在你自己的浏览器里 —— 无账号、无后端、无跟踪。

## 🚀 在线体验

**<https://1012905.github.io/MeloHeal/>**

网页版即开即用，也可以「安装」成本机应用：

| 浏览器 | 安装方式 |
|--------|----------|
| Chrome / Edge | 地址栏右侧的**安装**图标，或菜单 →「安装 音愈时光 MeloHeal」 |
| Safari (macOS) | 菜单栏 **文件 → 添加到程序坞** |
| iOS / iPadOS Safari | 分享 → **添加到主屏幕** |
| Android Chrome | 菜单 → **安装应用** |

安装后从桌面图标启动，**断网也能用**（Service Worker 预缓存了整个应用外壳）。

---

## ✨ 功能一览

### 📋 歌曲管理
- **添加 / 编辑** — 分类、语言标记、备注
- **批量导入** — 粘贴多行歌名，一键入库
- **删除 / 撤销** — 多选删除，`Ctrl + Z` 撤销
- **搜索 / 排序 / 视图** — 实时模糊搜索，A-Z / Z-A / 时间排序，列表与卡片两种视图
- **智能去重** — 标题归一化 + 模糊匹配，导入时自动识别重复

### 📁 歌单管理
- 创建自定义歌单，把歌曲加入歌单，按歌单过滤浏览

### 🎲 随机选歌
- 按分类 / 语言限定范围，一键抽取（带抽选动画）
- 选中后可跳转 **Bilibili / YouTube / 网易云音乐** 搜索

### 📊 数据统计
- 歌曲总数、分类分布、语言分布、添加/更新时间趋势

### 🎨 个性化与国际化
- 4 套主题（粉雾 · 蓝屿 · 翠林 · 紫烟）+ 亮/暗模式
- 简体中文 / English 切换，自动识别系统语言

### ⌨️ 快捷键
| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 添加歌曲 |
| `Ctrl + F` | 聚焦搜索框 |
| `Delete` | 删除选中歌曲 |
| `Ctrl + Z` | 撤销删除 |

---

## 🖥️ 网页版与桌面版

同一套前端代码，两种运行方式：

| | 网页版（GitHub Pages） | 桌面版（Tauri 2） |
|---|---|---|
| 打开方式 | 浏览器 / 安装为 PWA | 原生窗口（Windows / macOS / Linux） |
| 数据存储 | 浏览器 `localStorage` | 同一份 `localStorage`（WebView 内） |
| 额外能力 | 离线缓存、可安装 | 开机自启、Rust 端日志 |
| 构建 | `npm run build` → 单文件 `dist/index.html` | `npm run tauri build` |

桌面端专用能力（`invoke("log_error")` 等）在网页端**运行时自动降级**为 `console` 输出，不会因为缺少 Tauri 容器而报错。

---

## 🛠️ 本地开发

环境要求：**Node 20+**（CI 使用 Node 20）。

```bash
npm ci            # 严格按 lockfile 安装依赖
npm run dev       # 开发服务器 http://localhost:1420
npm test          # 单元测试（vitest）
npm run build     # 构建单文件产物到 dist/
npm run preview   # 本地预览 dist/
npm run tauri dev # 桌面端开发模式（需 Rust 工具链）
```

构建采用 [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile)：JS / CSS 全部内联进 **一个** `dist/index.html`，PWA 清单、Service Worker、图标与自托管字体作为静态文件随 `public/` 一起产出。

---

## 🚢 部署到 GitHub Pages

推送到 `main` 即自动发布，工作流见 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)：

```
npm ci → npm test → npm run build → 产物校验 → upload-pages-artifact → deploy-pages
```

产物校验会检查 PWA 资源是否齐全，并确认应用外壳里**不再出现任何外部 CDN**，不通过则中止发布。

一键脚本（本地自检 + 提交 + 推送 + 触发部署）：

```bash
npm run deploy:pages              # 交互确认后推送（需 Git Bash / Linux / macOS）
bash scripts/deploy-pages.sh --dry-run   # 只做测试+构建+产物校验，不推送
```

首次部署前，请在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

> ⚠️ 发布新版本后如需立刻刷新用户缓存，请把 `public/sw.js` 里的 `VERSION` 常量加一（例如 `meloheal-v1` → `meloheal-v2`），Service Worker 会在 `activate` 阶段清理旧缓存。

---

## 🔒 数据与隐私

- 所有歌曲、歌单、主题、语言设置都存在浏览器 `localStorage`，键名统一 `mh-` 前缀（`mh-songs`、`mh-playlists`、`mh-dark`、`mh-theme`、`mh-lang`）；
- 没有账号体系、没有服务端、没有埋点，应用不会把你的数据发到任何地方；
- 换浏览器或清理站点数据会清空曲库 —— 重要数据请先用「批量导入」的文本形式自行留档。

---

## 🎨 图标与字体（可复现生成）

仓库存放生成脚本，改配色 / 文案后可一键重出资源（需要 Python 3 + Pillow）：

```bash
npm run icons   # scripts/gen-icons.py：favicon / PWA 图标 / og-image.png
npm run fonts   # scripts/fetch-fonts.py：自托管字体子集 + fonts.css
```

- **图标**：圆角方底 + 音波五柱 + 珊瑚点缀，源文件 [`public/favicon.svg`](public/favicon.svg)，导出 `icon-192/512`、`icon-maskable-512`、`apple-touch-icon` 与 1200×630 分享图；
- **字体**：`Inter`（latin / latin-ext 完整切片）+ `Noto Sans SC`（应用文案子集），共约 235 KB，全部 `font-display: swap`，**不依赖 Google Fonts**；
  中文字体按 `unicode-range` 精确覆盖应用内出现的中文文案，用户自定义歌名里的生僻字由系统字体逐字回退。**新增中文文案后请重跑 `npm run fonts`。**

---

## 🗂️ 项目结构

```
MeloHeal/
├── index.html                  # 应用外壳（SEO / OG / PWA 元信息，字体与脚本入口）
├── src/
│   ├── App.jsx                 # 主组件：路由、信号状态、快捷键
│   ├── components/             # 按标签页划分的 UI 组件
│   ├── hooks/useSongStore.js   # 响应式数据层（localStorage CRUD）
│   ├── lib/                    # 纯函数：songs.js / i18n.js / locales
│   ├── styles/tokens.css       # 设计 Tokens（颜色 / 间距 / 字号 / 主题）
│   ├── error-logger.js         # 全局错误捕获（Tauri 缺失时降级为 console）
│   ├── pwa.js                  # Service Worker 注册
│   └── style.css               # 应用样式
├── public/                     # 原样拷贝进 dist 的静态资源
│   ├── manifest.webmanifest    # PWA 清单
│   ├── sw.js                   # Service Worker（预缓存 / network-first / SWR）
│   ├── favicon.svg             # 图标源文件
│   ├── og-image.png            # 社交分享图 1200×630
│   ├── icons/                  # 各尺寸 PNG 图标
│   └── fonts/                  # 自托管 woff2 + fonts.css
├── scripts/
│   ├── gen-icons.py            # 图标 / 分享图生成（Pillow）
│   ├── fetch-fonts.py          # 字体下载与子集化
│   └── deploy-pages.sh         # 一键发布脚本
├── .github/workflows/          # GitHub Pages 部署工作流
└── src-tauri/                  # Tauri 2 桌面壳（Rust）
```

---

## 📄 许可证

Copyright © 2025

本程序是自由软件：您可以根据自由软件基金会发布的 **GNU 通用公共许可证**（GPL）第三版或其（凭您选择）任何更新版本的条款，重新分发和/或修改它。

本程序的分发是希望它有用，但**没有任何担保**；甚至没有适销性或特定用途适用性的默示担保。详情请见 GNU 通用公共许可证。

随本程序应附有一份 GNU 通用公共许可证副本。如果没有，请见 <https://www.gnu.org/licenses/>。

```
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
