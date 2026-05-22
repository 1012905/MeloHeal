import { Show, For } from "solid-js";

export default function TabRandom(props) {
  const { store, lang, t } = props;
  const rF = props.randomFilters, srF = props.setRandomFilters;
  const hRP = props.handleRandomPick;
  const rA = props.randomAnimating;
  const rR = props.randomResult;
  const oS = props.openSearch;
  const cat = props.categories;

  return (
    <>
      <div class="section-card">
        <div class="section-title">{t(lang(), "tabRandom")}</div>
        <div class="toolbar-row" style="flex-wrap:wrap;">
          <select class="filter-select" value={rF().category}
            onChange={(e) => srF({ ...rF(), category: e.target.value })}>
            <option value="">{t(lang(), "pickFilterCategory")}</option>
            <For each={cat()}>{(c) => <option value={c}>{c}</option>}</For>
          </select>
          <select class="filter-select" value={rF().language}
            onChange={(e) => srF({ ...rF(), language: e.target.value })}>
            <option value="">{t(lang(), "pickFilterLanguage")}</option>
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>

        </div>

        <button class="btn-primary" onClick={hRP} disabled={rA()} style={{ margin: "16px 0" }}>
          🎲 {rA() ? "..." : t(lang(), "pickSong")}
        </button>

        <Show when={rR()}>
          <div class="result-card-inner" classList={{ "random-animate": true }}>
            <div class="result-label">{t(lang(), "pickResult")}</div>
            <div class="result-song">{rR().name}</div>
            <div class="btn-row" style="justify-content:center;">
              <button class="glass-btn" onClick={() => oS(rR().name, "bilibili")}>{t(lang(), "searchBilibili")}</button>
              <button class="glass-btn" onClick={() => oS(rR().name, "youtube")}>{t(lang(), "searchYoutube")}</button>
              <button class="glass-btn" onClick={() => oS(rR().name, "netease")}>{t(lang(), "searchNetEase")}</button>
            </div>
          </div>
        </Show>
      </div>

      <Show when={store.recentPicks().length > 0}>
        <div class="section-card">
          <div class="section-title">{t(lang(), "pickHistory")}</div>
          <div class="recent-picks">
            <For each={store.recentPicks().slice(0, 10)}>
              {(pick) => {
                const song = store.songs().find((s) => s.id === pick.songId);
                return song ? (
                  <div class="recent-pick-item">
                    🎵 {song.name}
                    <span class="text-muted" style="font-size:0.75rem;">{new Date(pick.pickedAt).toLocaleTimeString()}</span>
                  </div>
                ) : null;
              }}
            </For>
          </div>
        </div>
      </Show>
    </>
  );
}
