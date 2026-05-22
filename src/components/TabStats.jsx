import { Show, For } from "solid-js";

export default function TabStats(props) {
  const { store, lang, t } = props;

  const stats = () => store.getStats();

  return (
    <>
      <div class="section-card">
        <div class="section-title">{t(lang(), "tabStats")}</div>
        <div class="stats-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;">
          <div class="stat-badge highlight">
            <div class="stat-num">{stats().total}</div>
            <div class="stat-label">{t(lang(), "totalSongs")}</div>
          </div>
          <div class="stat-badge">
            <div class="stat-num">{stats().weekly}</div>
            <div class="stat-label">{t(lang(), "weeklyNew")}</div>
          </div>
          <div class="stat-badge">
            <div class="stat-num">{stats().monthly}</div>
            <div class="stat-label">{t(lang(), "monthlyNew")}</div>
          </div>
          <div class="stat-badge">
            <div class="stat-num">{stats().favorites}</div>
            <div class="stat-label">{t(lang(), "favorites")}</div>
          </div>
          <div class="stat-badge">
            <div class="stat-num">{stats().playlists}</div>
            <div class="stat-label">{t(lang(), "totalPlaylists")}</div>
          </div>
          <div class="stat-badge">
            <div class="stat-num">{stats().categories.length}</div>
            <div class="stat-label">{t(lang(), "totalCategories")}</div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">{t(lang(), "categoryDist")}</div>
        <Show when={stats().categories.length > 0} fallback={<div style="text-align:center;padding:20px;color:var(--text-muted);">{t(lang(), "noCategories")}</div>}>
          <div class="chart-bars" style="height:100px;">
            <For each={stats().categories}>
              {(cat) => (
                <div class="chart-bar-wrapper" title={`${cat.name}: ${cat.count}`}>
                  <div class="chart-bar" style={{
                    height: `${(cat.count / stats().categories[0].count) * 100}%`,
                    background: "var(--accent-solid)",
                  }} />
                </div>
              )}
            </For>
          </div>
          <div class="chart-labels">
            <For each={stats().categories}>
              {(cat) => <span class="chart-label-item">{cat.name}</span>}
            </For>
          </div>
        </Show>
      </div>

      <div class="section-card">
        <div class="section-title">{t(lang(), "langDist")}</div>
        <Show when={stats().languages.length > 0} fallback={<div style="text-align:center;padding:20px;color:var(--text-muted);">{t(lang(), "noLanguages")}</div>}>
          <div class="chart-bars" style="height:80px;">
            <For each={stats().languages}>
              {(langItem) => (
                <div class="chart-bar-wrapper" title={`${langItem.name}: ${langItem.count}`}>
                  <div class="chart-bar" style={{
                    height: `${(langItem.count / stats().languages[0].count) * 100}%`,
                    background: "var(--accent-solid)",
                  }} />
                </div>
              )}
            </For>
          </div>
          <div class="chart-labels">
            <For each={stats().languages}>
              {(langItem) => <span class="chart-label-item">{langItem.name}</span>}
            </For>
          </div>
        </Show>
      </div>
    </>
  );
}