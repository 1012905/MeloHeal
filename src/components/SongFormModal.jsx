import { createSignal, createEffect, Show, For } from "solid-js";
import { t } from "../lib/i18n.js";

export default function SongFormModal(props) {
  const [name, setName] = createSignal(props.initial?.name || "");
  const [category, setCategory] = createSignal(props.initial?.category || "");
  const [language, setLanguage] = createSignal(props.initial?.language || "");
  const [favorite, setFavorite] = createSignal(props.initial?.favorite || false);
  const [customCat, setCustomCat] = createSignal("");

  // Sync signals when props.initial changes (editing different song)
  createEffect(() => {
    const init = props.initial;
    if (init) {
      setName(init.name || "");
      setCategory(init.category || "");
      setLanguage(init.language || "");
      setFavorite(init.favorite || false);
      setCustomCat("");
    }
  });

  // Auto-save on any field change (debounced for name input)
  let saveTimer;
  let isInitial = true;
  const doSave = () => {
    if (!name().trim()) return;
    const cat = category() === "__new__" ? customCat().trim() : category();
    props.onAutoSave({
      name: name().trim(),
      category: cat,
      language: language() || "en",
      favorite: favorite(),
    });
  };
  createEffect(() => {
    // Track all signals to trigger on change
    void name(); void category(); void language(); void favorite(); void customCat();
    if (isInitial) { isInitial = false; return; } // skip initial mount
    clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 300);
  });

  return (
    <div class="modal-overlay" style="display:flex;" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
      <div class="modal-card glass-panel">
        <div class="modal-header">
          <span class="modal-title">{props.title}</span>
          <button class="modal-close-btn" onClick={props.onClose}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{t(props.lang, "songName")}</label>
            <input type="text" class="form-input" value={name()} onInput={(e) => setName(e.target.value)} autofocus required />
          </div>
          <div class="form-group">
            <label>{t(props.lang, "category")}</label>
            <select class="form-input" value={category()} onChange={(e) => setCategory(e.target.value)}>
              <option value="">--</option>
              <For each={props.categories || []}>{(cat) => <option value={cat}>{cat}</option>}</For>
              <option value="__new__">+ {t(props.lang, "addCategory") || "New Category"}</option>
            </select>
            <Show when={category() === "__new__"}>
              <input type="text" class="form-input" style="margin-top:6px;" placeholder="New category name"
                value={customCat()} onInput={(e) => setCustomCat(e.target.value)} />
            </Show>
          </div>
          <div class="form-group">
            <label>{t(props.lang, "language")}</label>
            <select class="form-input" value={language()} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>{t(props.lang, "favorite")}</label>
            <button type="button" class="fav-toggle-btn" classList={{ active: favorite() }}
              onClick={() => setFavorite(!favorite())}>
              {favorite() ? "⭐" : "☆"} {favorite() ? t(props.lang, "favorited") : t(props.lang, "favorite")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
