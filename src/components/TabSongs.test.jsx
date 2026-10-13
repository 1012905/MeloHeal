// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import TabSongs from "./TabSongs.jsx";
import { t } from "../lib/i18n.js";

/** 挂载一个最小化的 TabSongs，只关心选择相关行为 */
function mountTabSongs(initialSelected = []) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const [selected, setSelected] = createSignal(new Set(initialSelected));
  const [filters, setFilters] = createSignal({ category: "", language: "", favoriteOnly: false });
  const songs = [
    { id: "s1", name: "月亮代表我的心", language: "zh", category: "", favorite: false, createdAt: 1 },
    { id: "s2", name: "Moon River", language: "en", category: "", favorite: false, createdAt: 2 },
  ];
  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const dispose = render(
    () => (
      <TabSongs
        store={{}}
        lang={() => "zh"}
        t={t}
        categories={() => []}
        searchQuery={() => ""}
        setSearchQuery={() => {}}
        sortBy={() => "az"}
        setSortBy={() => {}}
        viewMode={() => "list"}
        setViewMode={() => {}}
        filters={filters}
        setFilters={setFilters}
        selectedSongs={selected}
        setSelectedSongs={setSelected}
        displayedSongs={() => songs}
        toggleSelect={toggleSelect}
        selectAll={() => setSelected(new Set(songs.map((s) => s.id)))}
        clearSelection={() => setSelected(new Set())}
        handleDeleteSelected={() => {}}
        setShowAddModal={() => {}}
        setShowBatchModal={() => {}}
        setEditSong={() => {}}
        openSearch={() => {}}
      />
    ),
    host
  );
  return { host, selected, dispose };
}

describe("TabSongs 选择", () => {
  let ctx;
  beforeEach(() => {
    document.body.innerHTML = "";
  });
  afterEach(() => ctx?.dispose());

  it("点击复选框能选中歌曲（回归：曾因行 onClick 与 onChange 双触发而选不中）", () => {
    ctx = mountTabSongs();
    // 注意：工具栏「仅收藏」也是 checkbox，必须精确定位歌曲行内的那个
    const checkbox = ctx.host.querySelector('.song-row .song-row-check input[type="checkbox"]');
    checkbox.click();
    expect([...ctx.selected()]).toEqual(["s1"]);
    // 再点一次应取消
    checkbox.click();
    expect([...ctx.selected()]).toEqual([]);
  });

  it("点击整行能切换选中", () => {
    ctx = mountTabSongs();
    const rows = ctx.host.querySelectorAll(".song-row");
    rows[1].click();
    expect([...ctx.selected()]).toEqual(["s2"]);
  });

  it("选中后工具栏按钮使用中文本地化文案，不出现原始 key", () => {
    ctx = mountTabSongs(["s1"]);
    const bar = ctx.host.querySelector(".selection-bar");
    expect(bar).toBeTruthy();
    const text = bar.textContent;
    expect(text).toContain("已选择");
    expect(text).toContain("全选");
    expect(text).toContain("清空选择");
    expect(text).not.toMatch(/selectAll|clearSelection/);
  });

  it("选择栏在未选中时不渲染", () => {
    ctx = mountTabSongs();
    expect(ctx.host.querySelector(".selection-bar")).toBeNull();
  });
});
