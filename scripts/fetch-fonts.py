#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""自托管字体抓取脚本 — 音愈时光 MeloHeal

做三件事：
  1. 收集应用源码里出现过的全部字符（JS/JSX/JSON/HTML/README）；
  2. 下载 Inter（latin + latin-ext 完整切片，变量字重 400–700）；
  3. 下载 Noto Sans SC 的「应用文案子集」（Google Fonts text= 接口，变量字重 400–700）；
  4. 生成 public/fonts/fonts.css（相对路径引用，GitHub Pages 子路径可用）。

为什么要子集化 Noto Sans SC：
  Noto Sans SC 全量有 101 个 woff2 切片（覆盖我们字符的就有 23 个，约 1.1 MB），
  而应用自身的中文文案只有几百字。text= 接口返回单个 woff2 + 精确 unicode-range，
  体积小一个数量级；未覆盖的汉字（例如用户自己输入的歌名）由系统字体逐字回退。

依赖：仅 Python 标准库。可重复执行（幂等，覆盖旧文件）。
用法：python scripts/fetch-fonts.py
"""

import glob
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "fonts")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# Windows 控制台默认 GBK，直接 print 中文/符号会 UnicodeEncodeError
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:  # noqa: BLE001 - 老版本 Python 没有 reconfigure
    pass

# 收录进子集的源码范围：只收「会真正渲染到界面上」的文件。
# README.md 之类的文档不渲染，收进来白白增大字体，故排除。
CORPUS_GLOBS = [
    "src/**/*.js",
    "src/**/*.jsx",
    "src/**/*.json",
    "index.html",
]
CORPUS_SKIP_DIRS = ("node_modules", "dist", "dist-check", "src-tauri", ".git")

INTER_CSS = "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap"
NOTO_CSS = ("https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400..700"
            "&display=swap&text=")

# latin / latin-ext 之外的切片（西里尔、希腊、越南语）不下载，应用用不到
INTER_KEEP = ("latin", "latin-ext")

# Noto Sans SC 只承担中文部分：Inter 已覆盖拉丁字母与西文标点，
# 把拉丁字符重复塞进中文字体只会白白增大体积。
CJK_RANGES = (
    (0x2E80, 0x303F),    # CJK 部首 + 康熙部首 + 中日韩符号与标点（、。《》「」）
    (0x3040, 0x30FF),    # 平假名 / 片假名
    (0x3400, 0x4DBF),    # CJK 扩展 A
    (0x4E00, 0x9FFF),    # CJK 基本区
    (0xF900, 0xFAFF),    # CJK 兼容表意文字
    (0xFE30, 0xFE4F),    # CJK 兼容形式
    (0xFF00, 0xFFEF),    # 全角字符（，！？：；）
    (0x20000, 0x2FA1F),  # CJK 扩展 B 及以后（极少见，命中才收）
)


# Noto Sans SC 承接「所有非 ASCII 字符」：汉字、中文标点，以及 ★ ♪ → ⚙ 这类
# 界面用到的符号（ASCII 拉丁字母/数字交给 Inter，避免重复占用体积）。
def is_cjk(ch):
    o = ord(ch)
    return any(lo <= o <= hi for lo, hi in CJK_RANGES)


def is_non_ascii(ch):
    """除 ASCII 之外全部收进中文字体子集（不含控制符）。"""
    return ord(ch) > 0x7F


def fetch(url, binary=False, retries=3, timeout=45):
    """带重试的 GET；失败抛最后一次异常。"""
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read()
            return data if binary else data.decode("utf-8")
        except Exception as exc:  # noqa: BLE001 - 网络错误统一重试
            last = exc
            if i < retries - 1:
                time.sleep(1.5 * (i + 1))
    raise last


def collect_chars():
    """扫描源码，返回 (charset, 文件数)。"""
    chars = set()
    files = []
    for pattern in CORPUS_GLOBS:
        for path in glob.glob(os.path.join(ROOT, pattern), recursive=True):
            norm = path.replace("\\", "/")
            if any(f"/{d}/" in norm for d in CORPUS_SKIP_DIRS):
                continue
            if "/public/fonts/" in norm:
                continue
            files.append(path)
            with open(path, encoding="utf-8", errors="ignore") as fh:
                chars |= set(fh.read())
    # 只保留可打印字符，去掉控制符
    chars = {c for c in chars if c.isprintable()}
    return "".join(sorted(chars)), len(files)


def parse_faces(css):
    """解析 @font-face 块，返回 [{comment, family, weight, url, unicode_range}]。"""
    faces = []
    # 切片 CSS 每个块前有 /* latin */ 之类注释；text= 子集接口没有注释，故注释可选
    pattern = r"(?:/\*\s*([^*]+?)\s*\*/\s*)?@font-face\s*\{(.*?)\}"
    for m in re.finditer(pattern, css, re.S):
        body = m.group(2)
        url = re.search(r"url\((https://[^)]+)\)", body)
        if not url:
            continue
        faces.append({
            "comment": (m.group(1) or "").strip(),
            "family": (re.search(r"font-family:\s*'([^']+)'", body) or [None, "?"])[1],
            "weight": (re.search(r"font-weight:\s*([^;]+);", body) or [None, "?"])[1].strip(),
            "url": url.group(1),
            "unicode_range": (re.search(r"unicode-range:\s*([^;]+);", body) or [None, ""])[1].strip(),
        })
    return faces


def save(url, filename, label, failures):
    """下载单个字体文件，返回字节数或 None。"""
    try:
        data = fetch(url, binary=True)
    except Exception as exc:  # noqa: BLE001 - 如实报告失败
        print(f"  [FAIL] {label}: 下载失败 — {exc}")
        failures.append(label)
        return None
    if not data.startswith(b"wOF2"):
        print(f"  [FAIL] {label}: 返回内容不是 woff2（magic={data[:4]!r}）")
        failures.append(label)
        return None
    path = os.path.join(OUT_DIR, filename)
    with open(path, "wb") as fh:
        fh.write(data)
    print(f"  [OK] {label}: {filename} — {len(data):,} 字节")
    return len(data)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    failures = []
    charset, n_files = collect_chars()
    cjk_count = sum(1 for c in charset if "\u4e00" <= c <= "\u9fff")
    print(f"[1/3] 扫描 {n_files} 个源文件，字符集 {len(charset)} 个（其中汉字 {cjk_count} 个）")

    # ── Inter：latin / latin-ext 完整切片 ──
    print("[2/3] 下载 Inter（变量字重 400–700）")
    blocks = []
    try:
        faces = parse_faces(fetch(INTER_CSS))
        picked = [f for f in faces if f["comment"] in INTER_KEEP]
        if not picked:
            raise RuntimeError(f"CSS 中未找到 {INTER_KEEP} 切片（共 {len(faces)} 个）")
        for face in picked:
            name = f"inter-{face['comment']}.woff2"
            if save(face["url"], name, f"Inter {face['comment']}", failures) is not None:
                blocks.append((face["family"], face["weight"], face["unicode_range"],
                               name, f"Inter {face['comment']}"))
    except Exception as exc:  # noqa: BLE001
        print(f"  [FAIL] Inter CSS 获取失败 — {exc}")
        failures.append("Inter CSS")

    # ── Noto Sans SC：应用文案子集（所有非 ASCII 字符） ──
    print("[3/3] 下载 Noto Sans SC 应用文案子集")
    try:
        noto_chars = "".join(c for c in charset if is_non_ascii(c))
        if not noto_chars:
            raise RuntimeError("源码里没有中文字符，跳过")
        css = fetch(NOTO_CSS + urllib.parse.quote(noto_chars, safe=""))
        faces = parse_faces(css)
        if not faces:
            raise RuntimeError("text= 子集接口未返回 @font-face")
        face = faces[0]
        name = "noto-sans-sc-subset.woff2"
        if save(face["url"], name, f"Noto Sans SC 子集（{len(noto_chars)} 字）",
                failures) is not None:
            blocks.append((face["family"], face["weight"], face["unicode_range"],
                           name, "Noto Sans SC 子集"))
    except Exception as exc:  # noqa: BLE001
        print(f"  [FAIL] Noto Sans SC 子集失败 — {exc}")
        failures.append("Noto Sans SC 子集")

    # ── 生成 fonts.css ──
    lines = [
        "/* ==========================================================================",
        "   音愈时光 MeloHeal — 自托管字体（零外部 CDN 依赖）",
        "",
        "   本文件由 scripts/fetch-fonts.py 自动生成，请勿手工编辑；",
        "   重新生成：npm run fonts",
        "",
        "   · Inter                —— latin / latin-ext 完整切片，变量字重 400–700",
        "   · Noto Sans SC         —— 应用文案子集，变量字重 400–700",
        "     未收录的汉字（如用户自定义歌名）按 unicode-range 由系统字体逐字回退",
        "   · 全部 font-display: swap，字体未就绪时先用回退字体渲染",
        "",
        "   相对路径引用，因此 GitHub Pages 子路径（/MeloHeal/）下同样可用。",
        "   ========================================================================== */",
        "",
    ]
    total = 0
    for family, weight, urange, filename, label in blocks:
        size = os.path.getsize(os.path.join(OUT_DIR, filename))
        total += size
        lines += [
            f"/* {label} — {size:,} 字节 */",
            "@font-face {",
            f"  font-family: '{family}';",
            "  font-style: normal;",
            f"  font-weight: {weight};",
            "  font-display: swap;",
            f"  src: url('{filename}') format('woff2');",
        ]
        if urange:
            lines.append(f"  unicode-range: {urange};")
        lines += ["}", ""]

    if blocks:
        with open(os.path.join(OUT_DIR, "fonts.css"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write("\n".join(lines))
        print(f"\n生成 public/fonts/fonts.css（{len(blocks)} 条 @font-face，合计 {total:,} 字节）")
    else:
        print("\n没有成功下载任何字体，未生成 fonts.css")
        return 1

    # ── 自检：生成的 unicode-range 是否覆盖语料里的每个字符 ──
    # 这一步防止「改了界面文案却忘了重跑字体脚本」导致的方块字。
    covered = set()
    for _family, _weight, urange, _filename, _label in blocks:
        if not urange:
            covered |= set(charset)
            continue
        for part in urange.split(","):
            part = part.strip().replace("U+", "").replace("u+", "")
            if not part:
                continue
            if "-" in part:
                lo, hi = (int(x, 16) for x in part.split("-"))
            else:
                lo = hi = int(part, 16)
            covered |= {c for c in charset if lo <= ord(c) <= hi}
    missing = [c for c in charset if c not in covered]
    missing_cjk = [c for c in missing if is_cjk(c)]
    pct = (len(charset) - len(missing)) * 100.0 / max(1, len(charset))
    print(f"覆盖自检：{len(charset) - len(missing)}/{len(charset)} 个字符（{pct:.1f}%）")
    if missing_cjk:
        print(f"!! 以下汉字未被任何字体覆盖，界面会出现回退字形：{''.join(missing_cjk)}")
        failures.append(f"{len(missing_cjk)} 个汉字未覆盖")
    elif missing:
        print(f"   未覆盖的非汉字（多为 emoji，由系统 emoji 字体渲染）：{''.join(missing)}")

    if failures:
        print(f"!! 失败项：{', '.join(failures)}")
        return 1
    print("全部字体就绪")
    return 0


if __name__ == "__main__":
    sys.exit(main())
