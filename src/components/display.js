/**
 * 展示层小工具（纯函数，无业务逻辑）
 * 仅用于 UI 呈现：导航图标化、封面占位块、日期格式化
 */

/** 去掉 i18n 文案开头的 emoji（导航改用 SVG 图标，避免 emoji 与图标重复） */
export function stripEmoji(text = "") {
  return String(text)
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "")
    .trim();
}

/* 封面占位块的可用色相：与品牌邻近的克制色域，全部满足白字可读 */
const COVER_HUES = [252, 320, 205, 172, 150, 285];

/** 由歌名派生一个稳定的封面色相（同一首歌永远同色；FNV-1a 保证分布均匀） */
export function coverHue(name = "") {
  let hash = 2166136261;
  for (const ch of String(name)) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return COVER_HUES[Math.abs(hash) % COVER_HUES.length];
}

/** 封面块首字：中文取首字，拉丁/数字取首字符大写 */
export function coverInitial(name = "") {
  const clean = String(name).replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "").trim();
  if (!clean) return "♪";
  const ch = clean[0];
  return /[a-z]/i.test(ch) ? ch.toUpperCase() : ch;
}

/** 注入到 style 的封面色相变量 */
export function coverStyle(name) {
  return { "--cover-hue": String(coverHue(name)) };
}

/** 收录日期短格式（元信息用，等宽数字） */
export function shortDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
