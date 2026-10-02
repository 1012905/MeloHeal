import { createSignal, createEffect, createMemo, Show, For, lazy, Suspense, onCleanup, onMount } from "solid-js";
import Header from "./components/Header.jsx";
import SongFormModal from "./components/SongFormModal.jsx";
import SkeletonPage from "./components/Skeleton.jsx";
import useSongStore from "./hooks/useSongStore.js";
import { t, getSystemLang } from "./lib/i18n.js";
import { parseSongs, toUniqueTitles } from "./lib/songs.js";
import { stripEmoji } from "./components/display.js";

const TabSongs = lazy(() => import("./components/TabSongs.jsx"));
const TabPlaylists = lazy(() => import("./components/TabPlaylists.jsx"));
const TabRandom = lazy(() => import("./components/TabRandom.jsx"));
const TabStats = lazy(() => import("./components/TabStats.jsx"));
const TabSettings = lazy(() => import("./components/TabSettings.jsx"));

const themes = ["pink", "blue", "green", "purple"];
/** 首次访问使用的品牌默认主题（深靛/梅子），不随机 */
const DEFAULT_THEME = "purple";

/* 导航图标（纯装饰，24×24 线性图标，currentColor 跟随主题） */
const TAB_ICONS = {
  songs: [
    "M9 17.5V6.4l10-2v11.1",
    "M9 17.5a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z",
    "M19 15.5a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z",
  ],
  playlists: ["M4 6.5h12", "M4 12h12", "M4 17.5h7"],
  random: [
    "M5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Z",
    "M8.5 9h.01", "M15.5 9h.01", "M12 12h.01", "M8.5 15h.01", "M15.5 15h.01",
  ],
  stats: ["M4 20h16", "M7.5 20v-5.5", "M12 20V6", "M16.5 20v-9"],
  settings: [
    "M4 7h8", "M17 7h3", "M4 17h3", "M12.5 17h7.5",
    "M15 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
    "M10.5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  ],
};

function TabIcon(props) {
  return (
    <svg class="tab-btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">
      {TAB_ICONS[props.tab].map((d) => <path d={d} />)}
    </svg>
  );
}

function applyDark(dark, theme) {
  themes.forEach((t) => document.body.classList.remove("theme-" + t));
  document.body.classList.add("theme-" + theme);
  if (dark) document.body.setAttribute("data-theme", "dark");
  else document.body.removeAttribute("data-theme");
  localStorage.setItem("mh-dark", dark);
  localStorage.setItem("mh-theme", theme);
}

export default function App() {
  const savedTheme = localStorage.getItem("mh-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme:dark)").matches;
  const saved = localStorage.getItem("mh-dark");
  // 首次访问固定用品牌默认主题（purple 深靛），不再随机 ——
  // 随机配色会让同一份设计每次打开都不一样，既影响品牌识别，
  // 也让分享截图/文档配图无法复现。用户仍可在设置里换成其余三套。
  const [currentTheme, setCurrentTheme] = createSignal(
    savedTheme && themes.includes(savedTheme) ? savedTheme : DEFAULT_THEME
  );
  const [isDark, setIsDark] = createSignal(saved !== null ? saved === "true" : prefersDark);
  createEffect(() => applyDark(isDark(), currentTheme()));

  const savedLang = localStorage.getItem("mh-lang");
  const [lang, setLang] = createSignal(savedLang || getSystemLang());
  createEffect(() => {
    document.documentElement.lang = lang() === "en" ? "en" : "zh-CN";
    localStorage.setItem("mh-lang", lang());
  });
  const toggleLang = () => setLang(lang() === "zh" ? "en" : "zh");

  const store = useSongStore();
  const [activeTab, setActiveTab] = createSignal("songs");
  const [searchQuery, setSearchQuery] = createSignal(""); // 输入框回显值（即时）
  const [debouncedQuery, setDebouncedQuery] = createSignal(""); // 实际过滤词（防抖）
  let searchTimer;
  /** 搜索防抖：字符即时回显，停顿 120ms 后才触发列表过滤/排序，避免逐字重算 */
  const handleSearchInput = (value) => {
    setSearchQuery(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => setDebouncedQuery(value), 120);
  };
  const [sortBy, setSortBy] = createSignal("az");
  const [viewMode, setViewMode] = createSignal("list");
  const [filters, setFilters] = createSignal({ category: "", language: "", favoriteOnly: false });
  const [selectedPlaylist, setSelectedPlaylist] = createSignal("all");
  const [selectedSongs, setSelectedSongs] = createSignal(new Set());
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [showBatchModal, setShowBatchModal] = createSignal(false);
  const [editSong, setEditSong] = createSignal(null);
  const [batchText, setBatchText] = createSignal("");
  const [newPlaylistName, setNewPlaylistName] = createSignal("");
  const [toastMsg, setToastMsg] = createSignal("");
  const [toastType, setToastType] = createSignal("info");
  const [duplicateWarnings, setDuplicateWarnings] = createSignal([]);
  const [addCreatedId, setAddCreatedId] = createSignal(null);
  const [randomFilters, setRandomFilters] = createSignal({ category: "", language: "" });
  const [randomResult, setRandomResult] = createSignal(null);
  const [randomAnimating, setRandomAnimating] = createSignal(false);

  let toastTimer;
  const showToast = (msg, type = "info") => {
    setToastMsg(msg);
    setToastType(type);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToastMsg(""), 2500);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "n") { e.preventDefault(); setShowAddModal(true); }
    if (e.ctrlKey && e.key === "f") { e.preventDefault(); document.getElementById("searchInput")?.focus(); }
    // 在输入框中不响应 Delete 快捷键，避免误删
    if (e.key === "Delete" && !["INPUT", "TEXTAREA"].includes(e.target.tagName) && selectedSongs().size > 0) { handleDeleteSelected(); }
    if (e.ctrlKey && e.key === "z") { if (store.undoDelete()) showToast(t(lang(), "saved"), "success"); }
  };

  onMount(() => window.addEventListener("keydown", handleKeyDown));
  onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  onCleanup(() => clearTimeout(searchTimer));

  // 过滤 + 排序结果做记忆化：只在搜索词/筛选/排序/曲库变化时重算一次，
  // 而不是列表里每一行渲染时都重算一遍（400 首时那是每次按键 300ms+ 的来源）
  const displayedSongs = createMemo(() => {
    const q = debouncedQuery();
    const flt = filters();
    const pl = selectedPlaylist();
    let list;
    if (pl && pl !== "all") {
      list = store.getPlaylistSongs(pl);
      if (q) list = list.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
    } else {
      list = store.searchSongs(q, flt);
    }
    return store.sortSongs(list, sortBy());
  });

  const handleEditSong = (id, updates) => {
    store.updateSong(id, updates);
    setEditSong(null);
    showToast(t(lang(), "saved"), "success");
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedSongs());
    if (ids.length === 0) return;
    store.deleteSongs(ids);
    setSelectedSongs(new Set());
    showToast(t(lang(), "deleted"), "warning");
  };

  /** 导入提示：跳过库内重复时额外提示跳过数量 */
  const importToast = (count, skipped) =>
    skipped > 0
      ? t(lang(), "importSkipped", count, skipped)
      : t(lang(), "importSuccess", count);

  const handleBatchImport = () => {
    // 与 TXT 导入同一套 music.txt 解析规则（跳过表头、遇统计行停止、归一化去重）
    const lines = toUniqueTitles(parseSongs(batchText()));
    if (lines.length === 0) return;
    const { added, skipped } = store.importSongs(lines);
    setBatchText("");
    setShowBatchModal(false);
    showToast(importToast(added.length, skipped), "success");
  };

  const handleExportTxt = () => {
    // 与 SongProcessing.html 相同：music.txt（UTF-8）
    const text = store.exportTxt();
    downloadBlob(text, "music.txt", "text/plain;charset=utf-8");
  };

  const handleExportJson = () => {
    const text = store.exportJson();
    downloadBlob(text, "meloheal-backup.json", "application/json;charset=utf-8");
  };

  /** 下载文件的辅助函数 */
  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  const handleImportTxt = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".txt";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const { added, skipped } = store.importTxt(ev.target.result);
        showToast(importToast(added.length, skipped), "success");
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleImportJson = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = store.importJson(ev.target.result);
        showToast(ok ? t(lang(), "saved") : t(lang(), "importFailed"), ok ? "success" : "warning");
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleRandomPick = () => {
    setRandomAnimating(true);
    setRandomResult(null);
    setTimeout(() => {
      const pick = store.pickRandom(randomFilters());
      setRandomResult(pick);
      setRandomAnimating(false);
    }, 400);
  };

  const openSearch = (name, platform) => {
    const q = encodeURIComponent(name);
    const urls = {
      bilibili: `https://search.bilibili.com/all?keyword=${q}`,
      youtube: `https://www.youtube.com/results?search_query=${q}`,
      netease: `https://music.163.com/#/search/m/?s=${q}`,
    };
    window.open(urls[platform], "_blank");
  };

  const toggleSelect = (id) => {
    setSelectedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedSongs(new Set(displayedSongs().map((s) => s.id)));
  const clearSelection = () => setSelectedSongs(new Set());

  const categories = createMemo(() => {
    const cats = new Set(store.songs().map((s) => s.category || ""));
    return Array.from(cats).filter(Boolean);
  });

  // Shared props passed to all tab components
  const tabCtx = { store, lang, t, categories, showToast };

  /* 导航项：与 activeTab 的取值一一对应，顺序即展示顺序 */
  const navTabs = ["songs", "playlists", "random", "stats", "settings"];

  return (
    <div class="glass-panel app-shell">
      {/* ── 左侧导航列：≤1023px 折叠为顶部横向 Tab，≤768px 固定为底部 Tab Bar ── */}
      <aside class="app-rail">
        <div class="rail-brand">
          <span class="app-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 17V5l10-2v10" />
              <path d="M9 17a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z" />
              <path d="M19 15a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z" />
            </svg>
          </span>
          <div class="rail-brand-text">
            <strong>{stripEmoji(t(lang(), "appTitle"))}</strong>
            <span>{t(lang(), "appSubtitle")}</span>
          </div>
        </div>

        <nav class="tab-bar" aria-label={stripEmoji(t(lang(), "appTitle"))}>
          <For each={navTabs}>
            {(tab) => (
              <button class="tab-btn" classList={{ active: activeTab() === tab }}
                aria-current={activeTab() === tab ? "page" : undefined}
                onClick={() => setActiveTab(tab)}>
                <TabIcon tab={tab} />
                <span class="tab-btn-label">{stripEmoji(t(lang(), `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`))}</span>
              </button>
            )}
          </For>
        </nav>

        <div class="rail-foot">
          <span class="rail-foot-count">{t(lang(), "songCount", store.songs().length)}</span>
          <span class="rail-foot-hint">{t(lang(), "appSubtitle")}</span>
        </div>
      </aside>

      <Header
        isDark={isDark()}
        onToggleTheme={() => setIsDark(!isDark())}
        lang={lang()}
        onToggleLang={toggleLang}
      />

      <div class="toast-container">
        <div class={`toast toast-${toastType()}`} role="status" style={{ opacity: toastMsg() ? "1" : "0", transform: toastMsg() ? "translateY(0)" : "translateY(-20px)" }}>
          {toastMsg()}
        </div>
      </div>

      <main class="tab-content">
        <Suspense fallback={<SkeletonPage />}>
          <Show when={activeTab() === "songs"}>
            <TabSongs {...tabCtx}
              searchQuery={searchQuery} setSearchQuery={handleSearchInput}
              sortBy={sortBy} setSortBy={setSortBy}
              viewMode={viewMode} setViewMode={setViewMode}
              filters={filters} setFilters={setFilters}
              selectedSongs={selectedSongs} setSelectedSongs={setSelectedSongs}
              displayedSongs={displayedSongs}
              toggleSelect={toggleSelect} selectAll={selectAll} clearSelection={clearSelection}
              handleDeleteSelected={handleDeleteSelected}
              setShowAddModal={setShowAddModal} setShowBatchModal={setShowBatchModal}
              setEditSong={setEditSong} openSearch={openSearch}
            />
          </Show>

          <Show when={activeTab() === "playlists"}>
            <TabPlaylists {...tabCtx}
              newPlaylistName={newPlaylistName} setNewPlaylistName={setNewPlaylistName}
              selectedPlaylist={selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist}
            />
          </Show>

          <Show when={activeTab() === "random"}>
            <TabRandom {...tabCtx}
              randomFilters={randomFilters} setRandomFilters={setRandomFilters}
              handleRandomPick={handleRandomPick}
              randomAnimating={randomAnimating} randomResult={randomResult}
              openSearch={openSearch}
            />
          </Show>

          <Show when={activeTab() === "stats"}>
            <TabStats {...tabCtx} />
          </Show>

          <Show when={activeTab() === "settings"}>
            <TabSettings {...tabCtx}
              themes={themes} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme}
              handleImportTxt={handleImportTxt} handleImportJson={handleImportJson}
              handleExportTxt={handleExportTxt} handleExportJson={handleExportJson}
            />
          </Show>
        </Suspense>
      </main>

      {/* ── Modals (kept inline for closure access) ── */}
      <Show when={showAddModal()}>
        <SongFormModal
          title={t(lang(), "addSong")} lang={lang()}
          onAutoSave={(data) => {
            if (!data.name.trim()) return;
            const id = addCreatedId();
            if (id) {
              store.updateSong(id, data);
            } else {
              // 检测重复
              const dups = store.checkDuplicates(data.name);
              if (dups.length > 0) setDuplicateWarnings([{ name: data.name, dups }]);
              const song = store.addSong(data.name, data);
              setAddCreatedId(song.id);
            }
          }}
          onClose={() => { setShowAddModal(false); setAddCreatedId(null); }}
          categories={categories()} duplicateWarnings={duplicateWarnings()}
          onDismissWarnings={() => setDuplicateWarnings([])}
        />
      </Show>

      <Show when={editSong()}>
        <SongFormModal
          title={t(lang(), "editSong")} lang={lang()}
          initial={editSong()}
          onAutoSave={(data) => { store.updateSong(editSong().id, data); }}
          onClose={() => setEditSong(null)}
          categories={categories()}
        />
      </Show>

      <Show when={showBatchModal()}>
        <div class="modal-overlay" style="display:flex;" onClick={(e) => { if (e.target === e.currentTarget) { setShowBatchModal(false); setBatchText(""); } }}>
          <div class="modal-card glass-panel">
            <div class="modal-header">
              <span class="modal-title">{t(lang(), "batchAdd")}</span>
              <button class="modal-close-btn" onClick={() => { setShowBatchModal(false); setBatchText(""); }}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              </button>
            </div>
            <div class="modal-body">
              <textarea class="batch-textarea" placeholder={t(lang(), "importText")}
                value={batchText()} onInput={(e) => setBatchText(e.target.value)} />
              <div class="btn-row" style="margin-top:12px;">
                <button class="btn-primary" onClick={handleBatchImport}>{t(lang(), "importBtn")}</button>
                <button class="glass-btn" onClick={() => { setShowBatchModal(false); setBatchText(""); }}>{t(lang(), "cancel")}</button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={duplicateWarnings().length > 0}>
        <div class="duplicate-warning">
          <For each={duplicateWarnings()}>
            {(w) => (
              <div class="duplicate-item">
                {t(lang(), "duplicateWarning", w.name)}
                <button class="glass-btn" onClick={() => setDuplicateWarnings([])}>
                  {t(lang(), "skip")}
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
