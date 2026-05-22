import { describe, it, expect } from "vitest";
import {
  normalizeTitle,
  parseSongs,
  processSongs,
  escapeHtml,
  buildOutputText,
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
});
