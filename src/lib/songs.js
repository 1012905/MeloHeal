"use strict";

/**
 * MeloHeal song utilities — normalization, parsing, language detection, fuzzy dedup
 */

export function normalizeTitle(title) {
  let result = "", newWord = true;
  for (const ch of title) {
    if (/[a-zA-Z]/.test(ch)) {
      result += newWord ? ch.toUpperCase() : ch.toLowerCase();
      newWord = false;
    } else if (ch === "'" || ch === "\u2019") {
      result += ch;
    } else if (ch === "-" || ch === "\u30FB") {
      result += ch;
      newWord = true;
    } else {
      result += ch;
      if (ch === " " || ch === "\u3000" || ch === "\t") newWord = true;
    }
  }
  return result;
}

/* ── music.txt 格式（与 SongProcessing.html 的导出/导入保持一致） ── */

/** 表头行：歌名 / Song Name */
export function isHeaderLine(line) {
  const t = String(line).trim();
  return t === "歌名" || /^song\s*name$/i.test(t);
}

/**
 * 统计行判定（对齐 SongProcessing.html 的 isStatisticsLine，并覆盖其漏判）：
 * · 规范统计行："共N首"（本项目导出格式）
 * · 原判定：以"共"开头且第 4 个字符是数字 → 如 "共1234首，..."、"共1234首，重新运行…"
 * · 补充："共" 后紧跟数字 → 如 "共8首，重新运行本程序以刷新统计数据。"
 * · 兼容英文统计行 "Total: 12"
 */
export function isStatisticsLine(line) {
  const t = String(line).trim();
  if (t.startsWith("共")) {
    if (/^共\s*\d/.test(t)) return true;
    if (t.length >= 4 && /\d/.test(t[3])) return true;
  }
  return /^total\s*[:\uff1a]/i.test(t);
}

/**
 * 按 music.txt 格式解析出歌名行：
 * 跳过表头及其后的空行 → 遇到统计行停止 → 忽略空行。
 * 无表头的纯歌名列表（粘贴批量导入）同样适用。
 */
export function parseSongs(text) {
  const lines = String(text).split(/\r?\n/);
  let start = 0;
  if (lines.length > 0 && isHeaderLine(lines[0])) {
    start = 1;
    if (start < lines.length && lines[start].trim() === "") start += 1;
  }
  const result = [];
  for (let i = start; i < lines.length; i++) {
    if (isStatisticsLine(lines[i])) break;
    const t = lines[i].trim();
    if (t && !isHeaderLine(t)) result.push(t);
  }
  return result;
}

/** 归一化标题并按 music.txt 规则在本次导入内去重（保留首次出现顺序） */
export function toUniqueTitles(lines) {
  const seen = new Set();
  const unique = [];
  for (const line of lines) {
    const normalized = normalizeTitle(String(line).trim());
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
}

/**
 * 导入前的库内查重：按规范化（NFKC + 去空白 + 忽略大小写）精确匹配，
 * 已存在的计入 skipped，其余按原顺序保留（同批内重复也一并去掉）。
 * 部分子串匹配不拦截，仅精确重复才跳过。
 * @param names 待导入歌名数组
 * @param existing 库中歌曲对象数组或纯歌名字符串数组
 * @returns {{ fresh: string[], skipped: number }}
 */
export function splitNewTitles(names, existing) {
  const pool = (existing || []).map((it) => (typeof it === "string" ? it : it?.name || ""));
  const fresh = [];
  let skipped = 0;
  for (const name of names) {
    const norm = normalizeForCompare(name);
    if (!norm) continue;
    if (pool.some((p) => normalizeForCompare(p) === norm)) {
      skipped++;
      continue;
    }
    fresh.push(name);
    pool.push(name);
  }
  return { fresh, skipped };
}

export function processSongs(songs) {
  const seen = new Set();
  const unique = [];
  let changes = 0;
  for (const s of songs) {
    const normalized = normalizeTitle(s);
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(normalized);
      if (normalized !== s) changes++;
    }
  }
  unique.sort((a, b) => a.localeCompare(b, "zh"));
  return { unique, changes, total: songs.length };
}

export function escapeHtml(s) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(s).replace(/[&<>"']/g, (ch) => map[ch]);
}

/**
 * 生成 music.txt 文本，结构与 SongProcessing.html 的导出一致：
 * 表头"歌名" → 空行 → 歌名列表 → 5 个空行 → 统计行（只保留"共N首"）
 * 例：歌名\n\nA\nB\n\n\n\n\n\n共2首
 */
export function buildOutputText(uniqueSongs) {
  const count = uniqueSongs.length;
  return "歌名\n\n" + uniqueSongs.join("\n") + "\n" + "\n\n\n\n\n" +
    `共${count}首`;
}

/* ── language detection ── */
export function detectLanguage(name) {
  // Kana (hiragana/katakana) → Japanese, regardless of kanji presence
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(name)) return "ja";
  // CJK without kana → Chinese
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(name)) return "zh";
  if (/[a-zA-Z]/.test(name)) return "en";
  return "other";
}

/* ── fuzzy dedup normalization ── */
export function normalizeForCompare(s) {
  return s.normalize("NFKC").replace(/[\s\u3000]+/g, " ").trim().toLowerCase();
}

export function findSimilar(name, existing) {
  const norm = normalizeForCompare(name);
  const results = [];
  for (const item of existing) {
    const snorm = normalizeForCompare(typeof item === "string" ? item : item.name);
    if (snorm === norm) results.push({ match: item, type: "exact" });
    else if (snorm.includes(norm) || norm.includes(snorm)) results.push({ match: item, type: "partial" });
  }
  return results;
}
