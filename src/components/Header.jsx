import { t } from "../lib/i18n.js";
import { stripEmoji } from "./display.js";

/**
 * 顶栏：品牌区（≤1023px 显示）+ 工具区（语言 / 明暗）
 * props 契约不变：isDark / onToggleTheme / lang / onToggleLang
 */
export default function Header(props) {
  return (
    <header class="app-header">
      <div class="header-left">
        <span class="app-mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 17V5l10-2v10" />
            <path d="M9 17a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z" />
            <path d="M19 15a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z" />
          </svg>
        </span>
        <div class="header-titles">
          <h1>{stripEmoji(t(props.lang, "appTitle"))}</h1>
          <span class="header-sub">{t(props.lang, "appSubtitle")}</span>
        </div>
      </div>

      <div class="header-actions">
        <button
          class="lang-switch-btn"
          onClick={props.onToggleLang}
          aria-label={t(props.lang, "langAria")}
          title={t(props.lang, "langAria")}
        >
          {t(props.lang, "langSwitch")}
        </button>

        <button
          type="button"
          class="theme-switch"
          classList={{ active: props.isDark }}
          onClick={props.onToggleTheme}
          aria-pressed={props.isDark}
          aria-label={t(props.lang, "themeToggleAria")}
          title={t(props.lang, "themeToggleAria")}
        >
          <svg class="theme-switch__icon icon-sun" width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 4.5V3M12 21v-1.5M4.5 12H3M21 12h-1.5M6.7 6.7 5.6 5.6M18.4 18.4l-1.1-1.1M6.7 17.3l-1.1 1.1M18.4 5.6l-1.1 1.1" />
            <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
          </svg>
          <svg class="theme-switch__icon icon-moon" width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
          </svg>
          <span class="visually-hidden">
            {t(props.lang, props.isDark ? "themeToggleDark" : "themeToggleLight")}
          </span>
        </button>
      </div>
    </header>
  );
}
