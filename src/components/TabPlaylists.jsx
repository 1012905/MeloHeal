import { Show, For, createSignal } from "solid-js";

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
        <div class="section-title">{t(lang(), "tabPlaylists")}</div>
        <div class="toolbar-row">
          <input type="text" class="search-input" style="flex:1"
            placeholder={t(lang(), "playlistName")}
            value={nPN()} onInput={(e) => snPN(e.target.value)} />
          <button class="glass-btn" onClick={() => {
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
                <span class="playlist-name">📁 {pl.name}</span>
                <span class="playlist-count">{t(lang(), "songCount", pl.songIds.length)}</span>
                <Show when={pl.id !== "default"}>
                  <button class="icon-btn-small" onClick={(e) => { e.stopPropagation(); store.deletePlaylist(pl.id); }}>🗑️</button>
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
                <div class="song-row" draggable="true"
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", song.id); setDragId(song.id); }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, song.id)}>
                  <span class="song-row-name">🎵 {song.name}</span>
                  <button class="icon-btn-small" onClick={() => {
                    store.removeSongFromPlaylist(song.id, sPL());
                    sT(t(lang(), "deleted"), "warning");
                  }}>✕</button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  );
}
