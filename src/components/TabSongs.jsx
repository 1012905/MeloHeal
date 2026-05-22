import { Show, For } from "solid-js";

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

  return (
    <>
      <div class="section-card">
        <div class="toolbar-row">
          <input id="searchInput" type="text" class="search-input"
            placeholder={t(lang(), "searchPlaceholder")}
            value={sQ()} onInput={(e) => ssQ(e.target.value)} />
          <button class="glass-btn" onClick={() => sSAM(true)}>{t(lang(), "addSong")}</button>
          <button class="glass-btn" onClick={() => sSBM(true)}>{t(lang(), "batchAdd")}</button>
        </div>

        <div class="toolbar-row" style="flex-wrap:wrap;">
          <select class="filter-select" value={sB()} onChange={(e) => ssB(e.target.value)}>
            <option value="az">{t(lang(), "sortAZ")}</option>
            <option value="za">{t(lang(), "sortZA")}</option>
            <option value="newest">{t(lang(), "sortNewest")}</option>
            <option value="random">{t(lang(), "sortRandom")}</option>
          </select>
          <select class="filter-select" value={flt().category} onChange={(e) => sFlt({ ...flt(), category: e.target.value })}>
            <option value="">{t(lang(), "allCategories")}</option>
            <For each={cat()}>{(c) => <option value={c}>{c}</option>}</For>
          </select>
          <select class="filter-select" value={flt().language} onChange={(e) => sFlt({ ...flt(), language: e.target.value })}>
            <option value="">{t(lang(), "allLanguages")}</option>
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="other">Other</option>
          </select>
          <label class="toggle-chip" classList={{ active: flt().favoriteOnly }}>
            <input type="checkbox" checked={flt().favoriteOnly}
              onChange={(e) => sFlt({ ...flt(), favoriteOnly: e.target.checked })} />
            ⭐ {t(lang(), "filterFavorite")}
          </label>
          <button class="glass-btn" onClick={() => svM(vM() === "list" ? "cards" : "list")}>
            {vM() === "list" ? "📇" : "📋"} {t(lang(), vM() === "list" ? "viewCards" : "viewList")}
          </button>
        </div>

        <Show when={sS().size > 0}>
          <div class="selection-bar">
            <span>{sS().size} {t(lang(), "selected")}</span>
            <button class="glass-btn" onClick={sA}>{t(lang(), "selectAll")}</button>
            <button class="glass-btn" onClick={cS}>{t(lang(), "clearSelection")}</button>
            <button class="glass-btn" style="color:var(--error-color)" onClick={hDS}>
              {t(lang(), "deleteSelected")} ({sS().size})
            </button>
          </div>
        </Show>
      </div>

      <div class="section-card">
        <Show when={dS().length === 0}>
          <div style="text-align:center;padding:40px 0;color:var(--text-muted);">{t(lang(), "noSongs")}</div>
        </Show>

        <Show when={vM() === "list"}>
          <div class="song-table">
            <For each={dS()}>
              {(song) => (
                <div class="song-row" classList={{ selected: sS().has(song.id) }}
                  onClick={() => tS(song.id)}
                  style={{ "animation-delay": `${dS().indexOf(song) * 30}ms` }}>
                  <span class="song-row-check">
                    <input type="checkbox" checked={sS().has(song.id)} onChange={(e) => { e.stopPropagation(); tS(song.id); }} />
                  </span>
                  <span class="song-row-name">{song.favorite && "⭐ "}{song.name}<span class="song-row-lang">{song.language}</span></span>
                  <span class="song-row-category">{song.category}</span>

                  <span class="song-row-actions">
                    <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); sES(song); }} title={t(lang(), "editSong")}>✏️</button>
                    <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); oS(song.name, "bilibili"); }} title={t(lang(), "searchBilibili")}>B站</button>
                    <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); oS(song.name, "youtube"); }} title={t(lang(), "searchYoutube")}>▶️</button>
                  </span>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={vM() === "cards"}>
          <div class="song-cards">
            <For each={dS()}>
              {(song) => (
                <div class="song-card" classList={{ selected: sS().has(song.id) }}
                  onClick={() => tS(song.id)}
                  style={{ "animation-delay": `${dS().indexOf(song) * 30}ms` }}>
                  <div class="song-card-header">
                    <span class="song-card-fav">{song.favorite ? "⭐" : ""}</span>
                    <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); sES(song); }}>✏️</button>
                  </div>
                  <div class="song-card-name">{song.name}</div>
                  <div class="song-card-meta">
                    <span class="lang-tag">{song.language}</span>
                    {song.category && <span class="cat-tag">{song.category}</span>}
                  </div>

                  <div class="song-card-actions">
                    <button class="glass-btn" style="font-size:0.75rem;padding:4px 10px;" onClick={(e) => { e.stopPropagation(); oS(song.name, "bilibili"); }}>{t(lang(), "searchBilibili")}</button>
                    <button class="glass-btn" style="font-size:0.75rem;padding:4px 10px;" onClick={(e) => { e.stopPropagation(); oS(song.name, "youtube"); }}>{t(lang(), "searchYoutube")}</button>
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
