import { Show, For, createSignal } from "solid-js";
import { coverStyle, coverInitial, stripEmoji } from "./display.js";

export default function TabPlaylists(props) {
  const { store, lang, t } = props;
  const nPN = props.newPlaylistName, snPN = props.setNewPlaylistName;
  const sPL = props.selectedPlaylist, ssPL = props.setSelectedPlaylist;
  const sT = props.showToast;
  const [dragId, setDragId] = createSignal(null);

  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e, targetSongId) => {
    e.preventDefault();
    const fromId = dragId();
    const toId = targetSongId;
    if (!fromId || fromId === toId) return;
    const plId = sPL();
    if (!plId || plId === "all") return;
    const songs = store.getPlaylistSongs(plId);
    const fromIdx = songs.findIndex((s) => s.id === fromId);
    const toIdx = songs.findIndex((s) => s.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...songs.map((s) => s.id)];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, fromId);
    store.updatePlaylistSortOrder(plId, reordered);
    setDragId(null);
  };

  return (
    <>
      <div class="section-card">
        <div class="section-title">{stripEmoji(t(lang(), "tabPlaylists"))}</div>
        <div class="toolbar-row">
          <input type="text" class="search-input" style="flex:1"
            placeholder={t(lang(), "playlistName")}
            value={nPN()} onInput={(e) => snPN(e.target.value)} />
          <button class="btn-primary" onClick={() => {
            if (nPN().trim()) {
              store.addPlaylist(nPN().trim());
              snPN("");
              sT(t(lang(), "saved"), "success");
            }
          }}>{t(lang(), "newPlaylist")}</button>
        </div>
        <div class="playlist-list">
          <For each={store.playlists()}>
            {(pl) => (
              <div class="playlist-item" classList={{ active: sPL() === pl.id }}
                onClick={() => ssPL(pl.id)}>
                <span class="playlist-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17V7.5Z" />
                  </svg>
                </span>
                <span class="playlist-name">{pl.name}</span>
                <span class="playlist-count">{t(lang(), "songCount", pl.songIds.length)}</span>
                <Show when={pl.id !== "default"}>
                  <button class="icon-btn-small" aria-label={t(lang(), "deleteSelected")}
                    onClick={(e) => { e.stopPropagation(); store.deletePlaylist(pl.id); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M4 7h16M9.5 7V5h5v2M6.5 7l1 12.5h9L17.5 7" />
                    </svg>
                  </button>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>

      <Show when={sPL() && sPL() !== "all"}>
        <div class="section-card">
          <div class="section-title">{store.playlists().find((p) => p.id === sPL())?.name}</div>
          <div class="song-table">
            <For each={store.getPlaylistSongs(sPL())}>
              {(song) => (
                <div class="song-row song-row--drag" draggable="true"
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", song.id); setDragId(song.id); }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, song.id)}>
                  <span class="song-row-handle" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>
                  </span>
                  <span class="song-cover" style={coverStyle(song.name)} aria-hidden="true">{coverInitial(song.name)}</span>
                  <span class="song-row-main">
                    <span class="song-row-name">{song.name}</span>
                    <span class="song-row-meta">
                      <Show when={song.category}><span class="song-row-category">{song.category}</span></Show>
                    </span>
                  </span>
                  <button class="icon-btn-small" aria-label={t(lang(), "deleted")} onClick={() => {
                    store.removeSongFromPlaylist(song.id, sPL());
                    sT(t(lang(), "deleted"), "warning");
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  );
}
