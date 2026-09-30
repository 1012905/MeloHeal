import { Show, For } from "solid-js";
import { stripEmoji, coverStyle, coverInitial } from "./display.js";

const LANG_KEYS = { zh: "langZh", en: "langEn", ja: "langJa", other: "langOther" };

export default function TabRandom(props) {
  const { store, lang, t } = props;
  const rF = props.randomFilters, srF = props.setRandomFilters;
  const hRP = props.handleRandomPick;
  const rA = props.randomAnimating;
  const rR = props.randomResult;
  const oS = props.openSearch;
  const cat = props.categories;

  const langLabel = (code) => (LANG_KEYS[code] ? t(lang(), LANG_KEYS[code]) : code || "");

  return (
    <>
      <div class="section-card spotlight">
        <div class="section-title">{stripEmoji(t(lang(), "tabRandom"))}</div>
        <div class="toolbar-row toolbar-row--wrap">
          <select class="filter-select" value={rF().category}
            onChange={(e) => srF({ ...rF(), category: e.target.value })}>
            <option value="">{t(lang(), "pickFilterCategory")}</option>
            <For each={cat()}>{(c) => <option value={c}>{c}</option>}</For>
          </select>
          <select class="filter-select" value={rF().language}
            onChange={(e) => srF({ ...rF(), language: e.target.value })}>
            <option value="">{t(lang(), "pickFilterLanguage")}</option>
            <option value="zh">{t(lang(), "langZh")}</option>
            <option value="en">{t(lang(), "langEn")}</option>
            <option value="ja">{t(lang(), "langJa")}</option>
          </select>
        </div>

        <div class="pick-stage">
          <button class="btn-primary btn-pick" onClick={hRP} disabled={rA()} aria-busy={rA()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Z" />
              <path d="M8.5 9h.01M15.5 9h.01M12 12h.01M8.5 15h.01M15.5 15h.01" />
            </svg>
            {stripEmoji(t(lang(), "pickSong"))}
          </button>

          <Show when={rA()}>
            <div class="pick-loading" aria-hidden="true">
              <div class="pick-loading-track" />
            </div>
          </Show>

          <Show when={!rA() && !rR() && store.songs().length === 0}>
            <div class="empty-state">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 17V5l10-2v10" />
                <path d="M9 17a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z" />
                <path d="M19 15a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z" />
              </svg>
              <p>{t(lang(), "noSongs")}</p>
            </div>
          </Show>

          <Show when={rR()}>
            <div class="result-card-inner random-animate">
              <div class="result-label">{t(lang(), "pickResult")}</div>
              <div class="result-song">{rR().name}</div>
              <div class="result-meta">
                <span class="song-cover song-cover--sm" style={coverStyle(rR().name)} aria-hidden="true">{coverInitial(rR().name)}</span>
                <Show when={rR().language}><span class="lang-tag">{langLabel(rR().language)}</span></Show>
                <Show when={rR().category}><span class="cat-tag">{rR().category}</span></Show>
              </div>
              <div class="btn-row btn-row--center">
                <button class="glass-btn" onClick={() => oS(rR().name, "bilibili")}>{t(lang(), "searchBilibili")}</button>
                <button class="glass-btn" onClick={() => oS(rR().name, "youtube")}>{t(lang(), "searchYoutube")}</button>
                <button class="glass-btn" onClick={() => oS(rR().name, "netease")}>{t(lang(), "searchNetEase")}</button>
              </div>
              <button class="glass-btn pick-again" onClick={hRP}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 11a8 8 0 1 0-2.3 6.3" /><path d="M20 5v6h-6" />
                </svg>
                {stripEmoji(t(lang(), "pickSong"))}
              </button>
            </div>
          </Show>
        </div>
      </div>

      <Show when={store.recentPicks().length > 0}>
        <div class="section-card">
          <div class="section-title">{stripEmoji(t(lang(), "pickHistory"))}</div>
          <div class="recent-picks">
            <For each={store.recentPicks().slice(0, 10)}>
              {(pick) => {
                const song = store.songs().find((s) => s.id === pick.songId);
                return song ? (
                  <div class="recent-pick-item">
                    <span class="recent-pick-name">
                      <span class="recent-pick-dot" aria-hidden="true" />
                      {song.name}
                    </span>
                    <span class="text-muted">{new Date(pick.pickedAt).toLocaleTimeString()}</span>
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
