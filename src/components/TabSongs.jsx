import { Show, For } from "solid-js";
import { coverStyle, coverInitial, shortDate, stripEmoji } from "./display.js";

/* 语言代码 → 既有 i18n key（不新增文案） */
const LANG_KEYS = { zh: "langZh", en: "langEn", ja: "langJa", other: "langOther" };

export default function TabSongs(props) {
  const { store, lang, t } = props;
  const sQ = props.searchQuery, ssQ = props.setSearchQuery;
  const sB = props.sortBy, ssB = props.setSortBy;
  const vM = props.viewMode, svM = props.setViewMode;
  const flt = props.filters, sFlt = props.setFilters;
  const sS = props.selectedSongs, ssS = props.setSelectedSongs;
  const dS = props.displayedSongs;
  const cat = props.categories;
  const tS = props.toggleSelect, sA = props.selectAll, cS = props.clearSelection;
  const hDS = props.handleDeleteSelected;
  const sSAM = props.setShowAddModal, sSBM = props.setShowBatchModal;
  const sES = props.setEditSong;
  const oS = props.openSearch;

  const langLabel = (code) => (LANG_KEYS[code] ? t(lang(), LANG_KEYS[code]) : code || "—");

  return (
    <>
      <div class="section-card">
        <div class="toolbar-row">
          <input id="searchInput" type="text" class="search-input"
            placeholder={t(lang(), "searchPlaceholder")}
            value={sQ()} onInput={(e) => ssQ(e.target.value)} />
          <button class="btn-primary" onClick={() => sSAM(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            {stripEmoji(t(lang(), "addSong"))}
          </button>
          <button class="glass-btn" onClick={() => sSBM(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
            {stripEmoji(t(lang(), "batchAdd"))}
          </button>
        </div>

        <div class="toolbar-row toolbar-row--wrap toolbar-row--filters">
          <select class="filter-select" value={sB()} onChange={(e) => ssB(e.target.value)} aria-label={t(lang(), "sortAZ")}>
            <option value="az">{t(lang(), "sortAZ")}</option>
            <option value="za">{t(lang(), "sortZA")}</option>
            <option value="newest">{t(lang(), "sortNewest")}</option>
            <option value="random">{t(lang(), "sortRandom")}</option>
          </select>
          <select class="filter-select" value={flt().category} onChange={(e) => sFlt({ ...flt(), category: e.target.value })} aria-label={t(lang(), "allCategories")}>
            <option value="">{t(lang(), "allCategories")}</option>
            <For each={cat()}>{(c) => <option value={c}>{c}</option>}</For>
          </select>
          <select class="filter-select" value={flt().language} onChange={(e) => sFlt({ ...flt(), language: e.target.value })} aria-label={t(lang(), "allLanguages")}>
            <option value="">{t(lang(), "allLanguages")}</option>
            <option value="zh">{t(lang(), "langZh")}</option>
            <option value="en">{t(lang(), "langEn")}</option>
            <option value="ja">{t(lang(), "langJa")}</option>
            <option value="other">{t(lang(), "langOther")}</option>
          </select>
          <label class="toggle-chip" classList={{ active: flt().favoriteOnly }}>
            <input type="checkbox" checked={flt().favoriteOnly}
              onChange={(e) => sFlt({ ...flt(), favoriteOnly: e.target.checked })} />
            <span class="chip-star" aria-hidden="true">★</span> {t(lang(), "filterFavorite")}
          </label>
          <button class="glass-btn view-toggle-btn" onClick={() => svM(vM() === "list" ? "cards" : "list")}>
            <Show when={vM() === "list"} fallback={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            }>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
              </svg>
            </Show>
            {t(lang(), vM() === "list" ? "viewCards" : "viewList")}
          </button>
        </div>

        <Show when={sS().size > 0}>
          <div class="selection-bar">
            <span>{sS().size} {t(lang(), "selected")}</span>
            <button class="glass-btn" onClick={sA}>{t(lang(), "selectAll")}</button>
            <button class="glass-btn" onClick={cS}>{t(lang(), "clearSelection")}</button>
            <button class="glass-btn danger-btn" onClick={hDS}>
              {t(lang(), "deleteSelected")} ({sS().size})
            </button>
          </div>
        </Show>
      </div>

      <div class="section-card">
        <Show when={dS().length === 0}>
          <div class="empty-state">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 17V5l10-2v10" />
              <path d="M9 17a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z" />
              <path d="M19 15a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z" />
            </svg>
            <p>{stripEmoji(t(lang(), "noSongs"))}</p>
          </div>
        </Show>

        <Show when={vM() === "list"}>
          <div class="song-table">
            <For each={dS()}>
              {(song, index) => (
                <div class="song-row" classList={{ selected: sS().has(song.id) }}
                  onClick={() => tS(song.id)}
                  /* 入场错峰只给前 10 行（上限 300ms），避免 400 首时逐行 indexOf 的 O(n²) 与 12 秒延迟 */
                  style={{ "animation-delay": `${Math.min(index(), 10) * 30}ms` }}>
                  <span class="song-row-check">
                    {/* 复选框自行处理点击：拦截 click 冒泡，避免同时触发行 onClick，导致"选中→取消"净零 */}
                    <input type="checkbox" checked={sS().has(song.id)} aria-label={song.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => tS(song.id)} />
                  </span>
                  <span class="song-cover" style={coverStyle(song.name)} aria-hidden="true">{coverInitial(song.name)}</span>
                  <span class="song-row-main">
                    <span class="song-row-name">
                      <Show when={song.favorite}><span class="song-row-fav" aria-hidden="true">★</span></Show>
                      {song.name}
                    </span>
                    <span class="song-row-meta">
                      <span class="song-row-lang">{langLabel(song.language)}</span>
                      <Show when={song.category}>
                        <span class="song-row-category">{song.category}</span>
                      </Show>
                      <Show when={shortDate(song.createdAt)}>
                        <span class="song-row-date">{shortDate(song.createdAt)}</span>
                      </Show>
                    </span>
                  </span>

                  <span class="song-row-actions">
                    <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); sES(song); }} title={t(lang(), "editSong")} aria-label={t(lang(), "editSong")}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="M13.5 6.5 17.5 10.5" />
                      </svg>
                    </button>
                    <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); oS(song.name, "bilibili"); }} title={t(lang(), "searchBilibili")}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M7 4.5 9.5 7M17 4.5 14.5 7" />
                        <path d="M5 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                        <path d="M9.5 11v3M14.5 11v3" />
                      </svg>
                      <span class="btn-label">B站</span>
                    </button>
                    <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); oS(song.name, "youtube"); }} title={t(lang(), "searchYoutube")} aria-label={t(lang(), "searchYoutube")}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M5 5.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
                        <path d="M10.5 9.5 15 12l-4.5 2.5v-5Z" />
                      </svg>
                    </button>
                  </span>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={vM() === "cards"}>
          <div class="song-cards">
            <For each={dS()}>
              {(song, index) => (
                <div class="song-card" classList={{ selected: sS().has(song.id) }}
                  onClick={() => tS(song.id)}
                  style={{ "animation-delay": `${Math.min(index(), 10) * 30}ms` }}>
                  <div class="song-card-cover" style={coverStyle(song.name)} aria-hidden="true">
                    {coverInitial(song.name)}
                  </div>
                  <div class="song-card-header">
                    <span class="song-card-fav" aria-hidden="true">{song.favorite ? "★" : ""}</span>
                    <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); sES(song); }} aria-label={t(lang(), "editSong")}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="M13.5 6.5 17.5 10.5" />
                      </svg>
                    </button>
                  </div>
                  <div class="song-card-name">{song.name}</div>
                  <div class="song-card-meta">
                    <span class="lang-tag">{langLabel(song.language)}</span>
                    {song.category && <span class="cat-tag">{song.category}</span>}
                  </div>

                  <div class="song-card-actions">
                    <button class="glass-btn btn-compact" onClick={(e) => { e.stopPropagation(); oS(song.name, "bilibili"); }}>{t(lang(), "searchBilibili")}</button>
                    <button class="glass-btn btn-compact" onClick={(e) => { e.stopPropagation(); oS(song.name, "youtube"); }}>{t(lang(), "searchYoutube")}</button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </>
  );
}
