import { stripEmoji } from "./display.js";

export default function TabSettings(props) {
  const { lang, t, themes } = props;
  const cT = props.currentTheme, scT = props.setCurrentTheme;
  const hIT = props.handleImportTxt, hIJ = props.handleImportJson;
  const hET = props.handleExportTxt, hEJ = props.handleExportJson;

  return (
    <>
      <div class="section-card">
        <div class="section-title">{stripEmoji(t(lang(), "themeTitle"))}</div>
        <div class="theme-picker">
          {themes.map((th) => (
            <button class="theme-swatch" classList={{ active: cT() === th }}
              /* --swatch-* 定义在 tokens.css，与各主题 --accent-solid 保持同步 */
              style={{ "--swatch-color": `var(--swatch-${th})` }}
              onClick={() => scT(th)}>
              <span class="theme-swatch-circle" />
              <span class="theme-swatch-label">{stripEmoji(t(lang(), `theme${th.charAt(0).toUpperCase() + th.slice(1)}`))}</span>
            </button>
          ))}
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">{stripEmoji(t(lang(), "importBtn"))} / {stripEmoji(t(lang(), "exportBtn"))}</div>
        <div class="btn-row">
          <button class="glass-btn" onClick={hIT}>{t(lang(), "importTxt")}</button>
          <button class="glass-btn" onClick={hIJ}>{t(lang(), "importJson")}</button>
          <button class="glass-btn" onClick={hET}>{t(lang(), "exportTxt")}</button>
          <button class="glass-btn" onClick={hEJ}>{t(lang(), "exportJson")}</button>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">{stripEmoji(t(lang(), "shortcutsTitle"))}</div>
        <div class="shortcuts-list">
          <div class="shortcut-item"><kbd>Ctrl+N</kbd> <span>{t(lang(), "shortcutAdd")}</span></div>
          <div class="shortcut-item"><kbd>Ctrl+F</kbd> <span>{t(lang(), "shortcutSearch")}</span></div>
          <div class="shortcut-item"><kbd>Del</kbd> <span>{t(lang(), "shortcutDelete")}</span></div>
          <div class="shortcut-item"><kbd>Ctrl+Z</kbd> <span>{t(lang(), "shortcutUndo")}</span></div>
        </div>
      </div>
    </>
  );
}
