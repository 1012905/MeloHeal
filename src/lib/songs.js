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

export function parseSongs(text) {
  return text.split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^共\d+首/.test(l) && l !== "歌名" && l !== "Song Name");
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

export function buildOutputText(uniqueSongs) {
  return ["歌名", "", ...uniqueSongs, "", `共${uniqueSongs.length}首`].join("\n");
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
