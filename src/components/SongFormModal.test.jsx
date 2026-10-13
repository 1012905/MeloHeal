// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render } from "solid-js/web";
import SongFormModal from "./SongFormModal.jsx";

describe("SongFormModal 语言默认值", () => {
  let dispose;
  afterEach(() => {
    dispose?.();
    document.body.innerHTML = "";
  });

  it("新增中文歌名时自动保存为 zh，而不是固定 en", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const saved = [];
    dispose = render(
      () => (
        <SongFormModal
          title="添加歌曲"
          lang="zh"
          categories={[]}
          onAutoSave={(d) => saved.push(d)}
          onClose={() => {}}
        />
      ),
      host
    );
    const nameInput = host.querySelector(".form-input");
    nameInput.value = "月亮代表我的心";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 450));
    expect(saved.length).toBeGreaterThan(0);
    expect(saved[saved.length - 1].language).toBe("zh");
  });

  it("新增英文歌名时自动保存为 en", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const saved = [];
    dispose = render(
      () => (
        <SongFormModal
          title="Add Song"
          lang="en"
          categories={[]}
          onAutoSave={(d) => saved.push(d)}
          onClose={() => {}}
        />
      ),
      host
    );
    const nameInput = host.querySelector(".form-input");
    nameInput.value = "Moon River";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 450));
    expect(saved[saved.length - 1].language).toBe("en");
  });

  it("手动选择语言后以手动选择为准", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const saved = [];
    dispose = render(
      () => (
        <SongFormModal
          title="添加歌曲"
          lang="zh"
          categories={[]}
          onAutoSave={(d) => saved.push(d)}
          onClose={() => {}}
        />
      ),
      host
    );
    const nameInput = host.querySelector(".form-input");
    nameInput.value = "月亮代表我的心";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    const selects = host.querySelectorAll("select.form-input");
    const langSelect = selects[selects.length - 1];
    langSelect.value = "ja";
    langSelect.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 450));
    expect(saved[saved.length - 1].language).toBe("ja");
  });
});
