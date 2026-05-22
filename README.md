# 🎵 音愈时光 — MeloHeal

**歌曲管理 · 歌单 · 随机选歌 · 数据统计**

> 🖥️ 基于 Solid.js + Tauri v2 的跨平台歌曲管理桌面应用

---

## ✨ 功能一览

### 📋 歌曲管理

- **添加** — 单首添加，支持分类 + 语言标记 + 备注
- **编辑** — 修改已有歌曲信息
- **批量导入** — 粘贴多行歌名，一键入库
- **删除** — 单选 / 多选删除，支持 Ctrl+Z 撤销
- **搜索** — 实时模糊搜索
- **排序** — 按字母 A-Z / Z-A / 添加时间排序
- **视图** — 列表 / 卡片两种展示模式
- **去重** — 内置模糊归一化处理，智能检测重复

### 📁 歌单管理

- 创建自定义歌单
- 将歌曲加入歌单
- 按歌单过滤浏览

### 🎲 随机选歌

- 按分类 / 语言筛选范围
- 一键随机抽取，带动画效果
- 选中后可一键打开 **Bilibili / YouTube / 网易云音乐** 搜索

### 📊 数据统计

- 歌曲总数、分类分布、语言分布
- 按添加时间、更新时间的趋势图

### 🔐 云同步（可选）

通过 Supabase 实现跨设备用户认证，支持登录后同步歌单数据。

### 🌐 国际化

- 简体中文 / English 双语切换
- 系统语言自动检测

### 🎨 个性化

- **4 套主题**：粉雾 · 蓝屿 · 翠林 · 紫烟
- **亮 / 暗模式**一键切换
- **自动启动**（Tauri 插件）

### ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 添加歌曲 |
| `Ctrl + F` | 聚焦搜索框 |
| `Delete` | 删除选中歌曲 |
| `Ctrl + Z` | 撤销删除 |

---

## 🖥️ 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | [Solid.js](https://www.solidjs.com/) + [Vite 6](https://vitejs.dev/) |
| 桌面壳 | [Tauri 2](https://v2.tauri.app/) (Rust) |
| 后端 | [Supabase](https://supabase.com/) (Auth) |
| 测试 | [Vitest](https://vitest.dev/) |
| 样式 | LightningCSS + CSS 自定义属性主题系统 |

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（浏览器）
npm run dev

# 启动 Tauri 桌面开发模式
npm run tauri dev

# 构建桌面应用
npm run tauri build

# 运行测试
npm test
```

### 环境变量

创建 `.env` 文件：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Supabase 配置为可选；不配置时应用完全离线运行，仅缺失登录功能。

---

## 🗂️ 项目结构

```
MeloHeal/
├── src/                    # 前端源码 (Solid.js)
│   ├── components/         # UI 组件（按标签页划分）
│   │   ├── TabSongs.jsx    # 📋 歌曲列表
│   │   ├── TabPlaylists.jsx# 📁 歌单管理
│   │   ├── TabRandom.jsx   # 🎲 随机选歌
│   │   ├── TabStats.jsx    # 📊 数据统计
│   │   ├── TabSettings.jsx # ⚙️ 设置
│   │   └── SongFormModal.jsx # 添加/编辑歌曲弹窗
│   ├── lib/
│   │   ├── songs.js        # 歌曲处理引擎（归一化/去重/解析/语言检测）
│   │   ├── songs.test.js   # 歌曲处理测试
│   │   └── i18n.js         # 国际化
│   ├── hooks/
│   │   └── useSongStore.js # 歌曲全局状态管理
│   ├── styles/             # CSS 自定义属性主题
│   └── App.jsx             # 主应用
├── src-tauri/              # Tauri Rust 后端
│   └── src/
│       ├── main.rs         # 桌面入口
│       └── lib.rs          # Tauri 插件注册（含 autostart）
├── shared/                 # 跨项目共享
│   ├── supabase.js         # Supabase 客户端 & API
│   └── components/AuthModal.jsx
└── package.json
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
