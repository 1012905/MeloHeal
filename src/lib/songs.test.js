import { describe, it, expect } from "vitest";
import {
  normalizeTitle,
  parseSongs,
  processSongs,
  escapeHtml,
  buildOutputText,
  detectLanguage,
  normalizeForCompare,
  findSimilar,
  isHeaderLine,
  isStatisticsLine,
  toUniqueTitles,
  splitNewTitles,
} from "./songs.js";

describe("normalizeTitle", () => {
  it("capitalizes first letter, lowercases rest", () => {
    expect(normalizeTitle("hello world")).toBe("Hello World");
  });
  it("handles empty string", () => {
    expect(normalizeTitle("")).toBe("");
  });
  it("handles don't contractions", () => {
    expect(normalizeTitle("don't stop")).toBe("Don't Stop");
  });
  it("handles hyphens", () => {
    expect(normalizeTitle("merry-go-round")).toBe("Merry-Go-Round");
  });
  it("preserves non-ASCII characters", () => {
    expect(normalizeTitle("前前前世")).toBe("前前前世");
    expect(normalizeTitle("光るなら")).toBe("光るなら");
  });
  it("handles mixed case", () => {
    expect(normalizeTitle("losT sTars")).toBe("Lost Stars");
    expect(normalizeTitle("crUEL summER")).toBe("Cruel Summer");
  });
});

describe("parseSongs", () => {
  it("splits text by line and filters empty/header/stats", () => {
    const text = "歌名\n\nSong A\nSong B\n共2首\n";
    expect(parseSongs(text)).toEqual(["Song A", "Song B"]);
  });

  it("解析 SongProcessing 导出的 music.txt（表头 + 5 空行 + 统计行）", () => {
    const text = "歌名\n\nLemon\nShape of You\n\n\n\n\n\n共2首，重新运行本程序以刷新统计数据。";
    expect(parseSongs(text)).toEqual(["Lemon", "Shape of You"]);
  });

  it("遇到统计行即停止，忽略其后内容", () => {
    const text = "歌名\n\nA\n共1首，重新运行本程序以刷新统计数据。\n不该出现的行";
    expect(parseSongs(text)).toEqual(["A"]);
  });

  it("兼容旧版导出（Song Name / 共N首 / Total: N）", () => {
    expect(parseSongs("Song Name\n\nA\nB\n\nTotal: 2")).toEqual(["A", "B"]);
    expect(parseSongs("歌名\n\nA\nB\n\n共2首")).toEqual(["A", "B"]);
  });

  it("兼容无表头的纯歌名列表与 CRLF 换行", () => {
    expect(parseSongs("A\r\nB\r\n")).toEqual(["A", "B"]);
    expect(parseSongs("  A  \n\nB\n")).toEqual(["A", "B"]);
  });
});

describe("统计行 / 表头判定", () => {
  it("识别 SongProcessing 的原判定（第 4 个字符是数字）", () => {
    expect(isStatisticsLine("共1234首，重新运行本程序以刷新统计数据。")).toBe(true);
  });
  it("覆盖原判定漏掉的规范统计行", () => {
    expect(isStatisticsLine("共8首，重新运行本程序以刷新统计数据。")).toBe(true);
    expect(isStatisticsLine("共2首")).toBe(true);
    expect(isStatisticsLine("共 8 首")).toBe(true);
  });
  it("识别英文统计行", () => {
    expect(isStatisticsLine("Total: 12")).toBe(true);
    expect(isStatisticsLine("total: 12")).toBe(true);
  });
  it("普通歌名不是统计行", () => {
    expect(isStatisticsLine("光るなら")).toBe(false);
    expect(isStatisticsLine("Blinding Lights")).toBe(false);
    expect(isStatisticsLine("共有8首歌")).toBe(false);
  });
  it("识别表头", () => {
    expect(isHeaderLine("歌名")).toBe(true);
    expect(isHeaderLine(" Song Name ")).toBe(true);
    expect(isHeaderLine("song name")).toBe(true);
    expect(isHeaderLine("Lemon")).toBe(false);
  });
});

describe("toUniqueTitles", () => {
  it("归一化标题并按 music.txt 规则去重", () => {
    expect(toUniqueTitles(["losT sTars", "Lost Stars", "Lemon", "前前前世"]))
      .toEqual(["Lost Stars", "Lemon", "前前前世"]);
  });
  it("忽略空行", () => {
    expect(toUniqueTitles(["", "  ", "Hello"])).toEqual(["Hello"]);
  });
});

describe("splitNewTitles（导入时的库内查重）", () => {
  it("跳过库中已存在的歌名（规范化精确匹配）", () => {
    const existing = [{ name: "Lemon" }, { name: "  shape of you " }];
    expect(splitNewTitles(["Lemon", "Shape Of You", "New Song"], existing))
      .toEqual({ fresh: ["New Song"], skipped: 2 });
  });
  it("支持纯字符串数组并去除同批内重复", () => {
    expect(splitNewTitles(["A", "a", "B"], ["B"])).toEqual({ fresh: ["A"], skipped: 2 });
  });
  it("部分匹配不拦截，仅精确重复才跳过", () => {
    expect(splitNewTitles(["Hello World"], [{ name: "Hello" }]))
      .toEqual({ fresh: ["Hello World"], skipped: 0 });
  });
  it("空库不跳过任何歌", () => {
    expect(splitNewTitles(["A", "B"], [])).toEqual({ fresh: ["A", "B"], skipped: 0 });
  });
});

describe("processSongs", () => {
  it("deduplicates case-insensitively and normalizes", () => {
    const result = processSongs(["Lover", "lover", "Cruel Summer"]);
    expect(result.unique).toEqual(["Cruel Summer", "Lover"]);
    // "lover" → "Lover" (1 change when it's first), "lover" (duplicate skipped)
    expect(result.changes).toBe(0);
    expect(result.total).toBe(3);
  });
});

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml('<script>"&')).toBe("&lt;script&gt;&quot;&amp;");
  });
});

describe("buildOutputText", () => {
  it("builds music.txt format", () => {
    const result = buildOutputText(["Song A", "Song B"]);
    expect(result).toContain("歌名");
    expect(result).toContain("Song A");
    expect(result).toContain("Song B");
    expect(result).toContain("共2首");
  });

  it("输出结构与 SongProcessing.html 一致，统计行只保留共N首", () => {
    // SongProcessing：'歌名\n\n' + 列表 + '\n' + 5 个 '\n' + 统计行
    expect(buildOutputText(["A", "B"]))
      .toBe("歌名\n\nA\nB\n\n\n\n\n\n共2首");
    expect(buildOutputText(["A", "B"]).split("\n").pop()).toBe("共2首");
  });

  it("空列表仍保持格式结构", () => {
    const text = buildOutputText([]);
    expect(text.startsWith("歌名\n\n")).toBe(true);
    expect(text.endsWith("共0首")).toBe(true);
    expect(parseSongs(text)).toEqual([]);
  });

  it("导出 → 导入 往返一致", () => {
    const songs = ["Lemon", "Shape of You", "前前前世", "Blinding Lights"];
    expect(parseSongs(buildOutputText(songs))).toEqual(songs);
  });
});

describe("detectLanguage", () => {
  it("detects English", () => {
    expect(detectLanguage("Hello World")).toBe("en");
    expect(detectLanguage("Lost Stars")).toBe("en");
  });
  it("detects Chinese", () => {
    expect(detectLanguage("前前前世")).toBe("zh");
    expect(detectLanguage("光るなら")).toBe("ja"); // kana → Japanese
  });
  it("detects Japanese (kana)", () => {
    expect(detectLanguage("アイドル")).toBe("ja");
    expect(detectLanguage("光るなら")).toBe("ja");
  });
  it("detects mixed", () => {
    expect(detectLanguage("Lemon (レモン)")).toBe("ja");
  });
  it("detects other for non-CJK/non-Latin", () => {
    expect(detectLanguage("")).toBe("other");
  });
});

describe("normalizeForCompare", () => {
  it("normalizes NFKC and trims spaces", () => {
    expect(normalizeForCompare("  Hello　World  ")).toBe("hello world");
  });
  it("lowercases result", () => {
    expect(normalizeForCompare("LOST STARS")).toBe("lost stars");
  });
});

describe("findSimilar", () => {
  it("finds exact match", () => {
    const existing = [{ name: "Hello World" }, { name: "Goodbye" }];
    const result = findSimilar("hello world", existing);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].type).toBe("exact");
  });
  it("finds partial match", () => {
    const existing = ["Hello World Hello"];
    const result = findSimilar("Hello", existing);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].type).toBe("partial");
  });
  it("returns empty for no match", () => {
    const result = findSimilar("NotInList", ["Something Else"]);
    expect(result.length).toBe(0);
  });
  it("handles string array items", () => {
    const result = findSimilar("Test", ["Test", "Other"]);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("exact");
  });
});
