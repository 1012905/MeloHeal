import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zh from "./locales/zh.js";
import en from "./locales/en.js";

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** 递归收集 src 下的源码文件 */
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) out.push(p);
  }
  return out;
}

/** 代码中所有 t(lang(), "key") 形式的字面量 key */
function usedLiteralKeys() {
  const re = /\bt\(\s*(?:lang\(\)|props\.lang|lang)\s*,\s*["']([A-Za-z0-9_]+)["']/g;
  const keys = new Map();
  for (const file of walk(srcRoot)) {
    const src = fs.readFileSync(file, "utf8");
    let m;
    while ((m = re.exec(src))) {
      if (!keys.has(m[1])) keys.set(m[1], path.relative(srcRoot, file));
    }
  }
  return keys;
}

describe("i18n 文案完整性", () => {
  it("zh 与 en 的 key 集合一致", () => {
    const zk = Object.keys(zh).sort();
    const ek = Object.keys(en).sort();
    expect(ek).toEqual(zk);
  });

  it("代码里用到的每个 t() 字面量 key 都在两套文案里存在", () => {
    const missing = [];
    for (const [key, file] of usedLiteralKeys()) {
      if (!(key in zh) && !(key in en)) missing.push(key + " (" + file + ")");
    }
    expect(missing).toEqual([]);
  });

  it("动态拼接的 key 都能解析", () => {
    const dynamic = [
      "tabSongs", "tabPlaylists", "tabRandom", "tabStats", "tabSettings",
      "themePink", "themeBlue", "themeGreen", "themePurple",
      "themeToggleDark", "themeToggleLight",
      "viewCards", "viewList",
      "langZh", "langEn", "langJa", "langOther",
    ];
    for (const key of dynamic) {
      expect(zh[key], "zh 缺少 " + key).toBeTruthy();
      expect(en[key], "en 缺少 " + key).toBeTruthy();
    }
  });
});
