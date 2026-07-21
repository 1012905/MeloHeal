import { createSignal, createEffect, Show, For, lazy, Suspense, onCleanup, onMount } from "solid-js";
import Header from "./components/Header.jsx";
import SongFormModal from "./components/SongFormModal.jsx";
import SkeletonPage from "./components/Skeleton.jsx";
import useSongStore from "./hooks/useSongStore.js";
import { t, getSystemLang } from "./lib/i18n.js";

const TabSongs = lazy(() => import("./components/TabSongs.jsx"));
const TabPlaylists = lazy(() => import("./components/TabPlaylists.jsx"));
const TabRandom = lazy(() => import("./components/TabRandom.jsx"));
const TabStats = lazy(() => import("./components/TabStats.jsx"));
const TabSettings = lazy(() => import("./components/TabSettings.jsx"));

const themes = ["pink", "blue", "green", "purple"];

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
  const [currentTheme, setCurrentTheme] = createSignal(
    savedTheme && themes.includes(savedTheme) ? savedTheme : themes[Math.floor(Math.random() * themes.length)]
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
  const [searchQuery, setSearchQuery] = createSignal("");
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
    if (e.key === "Delete" && selectedSongs().size > 0) { handleDeleteSelected(); }
    if (e.ctrlKey && e.key === "z") { if (store.undoDelete()) showToast(t(lang(), "saved"), "success"); }
  };

  onMount(() => window.addEventListener("keydown", handleKeyDown));
  onCleanup(() => window.removeEventListener("keydown", handleKeyDown));

  const displayedSongs = () => {
    const q = searchQuery();
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
  };

  const handleAddSong = (name, overrides = {}) => {
    if (!name.trim()) return;
    const dups = store.checkDuplicates(name);
    if (dups.length > 0) setDuplicateWarnings([{ name, dups }]);
    store.addSong(name, overrides);
    showToast(t(lang(), "saved"), "success");
  };

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

  const handleBatchImport = () => {
    const lines = batchText().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    store.addSongs(lines);
    setBatchText("");
    setShowBatchModal(false);
    showToast(t(lang(), "importSuccess", lines.length), "success");
  };

  const handleExportTxt = () => {
    const text = store.exportTxt();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "meloheal-songs.txt";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const text = store.exportJson();
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "meloheal-backup.json";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImportTxt = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".txt";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const count = store.importTxt(ev.target.result).length;
        showToast(t(lang(), "importSuccess", count), "success");
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

  const categories = () => {
    const cats = new Set(store.songs().map((s) => s.category || ""));
    return Array.from(cats).filter(Boolean);
  };

  // Shared props passed to all tab components
  const tabCtx = { store, lang, t, categories, showToast };

  return (
    <div class="glass-panel">
      <Header
        isDark={isDark()}
        onToggleTheme={() => setIsDark(!isDark())}
        lang={lang()}
        onToggleLang={toggleLang}
      />

      <div class="tab-bar">
        {["songs", "playlists", "random", "stats", "settings"].map((tab) => (
          <button class="tab-btn" classList={{ active: activeTab() === tab }}
            onClick={() => setActiveTab(tab)}>
            {t(lang(), `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
          </button>
        ))}
      </div>

      <div class="toast-container">
        <div class={`toast toast-${toastType()}`} style={{ opacity: toastMsg() ? "1" : "0", transform: toastMsg() ? "translateY(0)" : "translateY(-20px)" }}>
          {toastMsg()}
        </div>
      </div>

      <Suspense fallback={<SkeletonPage />}>
        <Show when={activeTab() === "songs"}>
          <TabSongs {...tabCtx}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
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
        <div class="modal-overlay" style="display:flex;" onClick={(e) => { if (e.target === e.currentTarget) setShowBatchModal(false); }}>
          <div class="modal-card glass-panel">
            <div class="modal-header">
              <span class="modal-title">{t(lang(), "batchAdd")}</span>
              <button class="modal-close-btn" onClick={() => setShowBatchModal(false)}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              </button>
            </div>
            <div class="modal-body">
              <textarea class="batch-textarea" placeholder={t(lang(), "importText")}
                value={batchText()} onInput={(e) => setBatchText(e.target.value)} />
              <div class="btn-row" style="margin-top:12px;">
                <button class="btn-primary" onClick={handleBatchImport}>{t(lang(), "importBtn")}</button>
                <button class="glass-btn" onClick={() => setShowBatchModal(false)}>{t(lang(), "cancel")}</button>
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
                <button class="glass-btn" style="font-size:0.8rem;" onClick={() => setDuplicateWarnings([])}>
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
