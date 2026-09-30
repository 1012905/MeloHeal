#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""图标 / 分享图生成 — 音愈时光 MeloHeal

用 bundled Python + Pillow 从零绘制（不下载任何现成图标），产出：

  public/icons/favicon-32.png          32×32    圆角方底（浏览器标签页）
  public/icons/apple-touch-icon.png    180×180  满幅底（iOS 自行裁圆角）
  public/icons/icon-192.png            192×192  PWA any
  public/icons/icon-512.png            512×512  PWA any
  public/icons/icon-maskable-512.png   512×512  PWA maskable（内容收在中宫安全区）
  public/og-image.png                  1200×630 社交分享图（中文标题「音愈时光」）

几何与配色和手写的 public/favicon.svg 一一对应：圆角方底 + 音波五柱 + 珊瑚点缀。

实现要点：
  · 全部图形以 4× 超采样绘制后 LANCZOS 缩放，得到抗锯齿边缘（Pillow 无原生 AA）；
  · 渐变、柔光斑用 Image + GaussianBlur 合成，不引入 numpy / cairosvg；
  · 中文标题优先用系统 Noto Sans SC 可变字体渲染，逐级回退到雅黑 / 等线 / 黑体。

依赖：Pillow（bundled Python 自带）。可重复执行（幂等覆盖）。
用法：python scripts/gen-icons.py
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:  # noqa: BLE001 - 老版本 Python 没有 reconfigure
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
ICONS = os.path.join(PUBLIC, "icons")

# ── 品牌色 ──────────────────────────────────────────────────────────────────
BG_LIGHT = (248, 247, 251)      # #F8F7FB 浅色底
INDIGO_LIGHT = (108, 92, 168)   # #6C5CA8 深靛（渐变亮端）
INDIGO = (91, 75, 138)          # #5B4B8A 主色
INDIGO_DARK = (74, 60, 120)     # #4A3C78 深靛（渐变暗端）
CORAL = (255, 122, 107)         # #FF7A6B 珊瑚点缀
INK = (28, 26, 34)              # #1C1A22 墨色
MUTED = (122, 117, 137)         # #7A7589

# ── 音波几何（viewBox 0 0 64 64，与 public/favicon.svg 完全一致） ────────────
VB = 64.0
BAR_X = (11.0, 20.0, 29.0, 38.0, 47.0)   # 五根音波柱的左边缘
BAR_H = (12.0, 20.0, 34.0, 22.0, 12.0)   # 高度
BAR_W = 6.0
BAR_R = 3.0
CORAL_INDEX = 2                          # 最高的那根用珊瑚色
BG_RADIUS = 15.0                         # 圆角方底半径
MARK_W = BAR_X[-1] - BAR_X[0] + BAR_W    # 柱组总宽 = 42

SS = 4  # 超采样倍数


def diag_gradient(size, c1, c2):
    """左上 → 右下 的线性渐变（纯 Pillow，逐像素）。"""
    img = Image.new("RGB", (size, size))
    px = img.load()
    denom = max(1, 2 * (size - 1))
    for y in range(size):
        for x in range(size):
            t = (x + y) / denom
            px[x, y] = (round(c1[0] + (c2[0] - c1[0]) * t),
                        round(c1[1] + (c2[1] - c1[1]) * t),
                        round(c1[2] + (c2[2] - c1[2]) * t))
    return img


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1],
                                           radius=radius, fill=255)
    return mask


def paste_mark(img, unit, cx, cy, scale_alpha=1.0):
    """在 img 上画音波五柱；unit = 1 个 viewBox 单位对应的像素。"""
    draw = ImageDraw.Draw(img)
    x0 = cx - MARK_W * unit / 2.0
    for i, (bx, bh) in enumerate(zip(BAR_X, BAR_H)):
        x = x0 + (bx - BAR_X[0]) * unit
        h = bh * unit
        top = cy - h / 2.0
        if i == CORAL_INDEX:
            fill = CORAL + (round(255 * scale_alpha),)
        else:
            fill = BG_LIGHT + (round(255 * scale_alpha),)
        draw.rounded_rectangle([x, top, x + BAR_W * unit, top + h],
                               radius=BAR_R * unit, fill=fill)


def render_icon(size, full_bleed=False, mark_ratio=1.0):
    """生成一枚方形图标。

    full_bleed=True  —— 背景铺满整张图（maskable / apple-touch-icon，不可有透明角）
    mark_ratio       —— 音波整体缩放，maskable 用它把内容收进安全区
    """
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    grad = diag_gradient(s, INDIGO_LIGHT, INDIGO_DARK)
    if full_bleed:
        img.paste(grad, (0, 0))
    else:
        img.paste(grad, (0, 0), rounded_mask(s, round(s * BG_RADIUS / VB)))
    paste_mark(img, s / VB * mark_ratio, s / 2.0, s / 2.0)
    return img.resize((size, size), Image.LANCZOS)


# ── 中文字体解析（分享图需要真汉字，图标本体不需要） ────────────────────────
FONT_CANDIDATES = (
    (r"C:\Windows\Fonts\NotoSansSC-VF.ttf", 0),
    (r"C:\Windows\Fonts\msyhbd.ttc", 0),
    (r"C:\Windows\Fonts\msyh.ttc", 0),
    (r"C:\Windows\Fonts\Dengb.ttf", 0),
    (r"C:\Windows\Fonts\simhei.ttf", 0),
    ("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 0),
    ("/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc", 0),
    ("/System/Library/Fonts/PingFang.ttc", 0),
)


def load_font(px, weight=400):
    """按候选列表找一个能渲染中文的字体，并尽量切到指定字重。"""
    errors = []
    for path, index in FONT_CANDIDATES:
        if not os.path.exists(path):
            continue
        try:
            font = ImageFont.truetype(path, px, index=index)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{path}: {exc}")
            continue
        if font.getlength("音") <= 0:
            errors.append(f"{path}: 无中文字形")
            continue
        if weight != 400:
            for apply in (lambda f=font: f.set_variation_by_axes([weight]),
                          lambda f=font: f.set_variation_by_name("Bold")):
                try:
                    apply()
                    break
                except Exception:  # noqa: BLE001 - 静态字体没有可变轴，忽略
                    pass
        return font
    raise SystemExit("找不到可用的中文字体，尝试过：\n  " + "\n  ".join(errors))


def build_og_image():
    """1200×630 分享图：柔和渐变底 + 中文标题 + 副标 + 音波装饰。"""
    w, h, s = 1200, 630, 2          # 2× 渲染后缩放，文字边缘更干净
    W, H = w * s, h * s

    bg = diag_gradient(max(W, H), (252, 251, 255), (236, 232, 246))
    bg = bg.crop((0, 0, W, H)).convert("RGBA")

    # 柔光斑：右上深靛、左下珊瑚，模糊后叠加
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W - 470 * s, -160 * s, W + 130 * s, 440 * s], fill=INDIGO + (34,))
    gd.ellipse([-140 * s, H - 260 * s, 360 * s, H + 140 * s], fill=CORAL + (40,))
    glow = glow.filter(ImageFilter.GaussianBlur(70 * s))
    bg = Image.alpha_composite(bg, glow)

    # 右侧大号音波装饰（低透明度，呼应图标）
    deco = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    unit = 7.4 * s
    paste_mark(deco, unit, W - 250 * s, H / 2.0, scale_alpha=0.13)
    bg = Image.alpha_composite(bg, deco)

    d = ImageDraw.Draw(bg)

    # 应用图标 + 英文名
    icon_px = 116
    icon = render_icon(icon_px * s, full_bleed=False, mark_ratio=1.0)
    icon_x, icon_y = 88 * s, 78 * s
    bg.alpha_composite(icon, (icon_x, icon_y))
    d.text((icon_x + icon_px * s + 26 * s, icon_y + icon_px * s / 2),
           "MeloHeal", font=load_font(44 * s, 600), fill=INDIGO, anchor="lm")

    # 主标题 / 副标题
    d.text((88 * s, 268 * s), "音愈时光", font=load_font(104 * s, 700),
           fill=INK, anchor="la")
    d.text((92 * s, 412 * s), "歌曲管理 · 歌单 · 统计 · 随机选歌",
           font=load_font(40 * s, 500), fill=INDIGO, anchor="la")

    # 珊瑚分隔线
    d.rounded_rectangle([88 * s, 486 * s, 200 * s, 494 * s],
                        radius=4 * s, fill=CORAL)

    d.text((88 * s, 522 * s), "纯本地运行 · 数据只存在你的浏览器里",
           font=load_font(28 * s, 400), fill=MUTED, anchor="la")
    d.text((W - 88 * s, 528 * s), "1012905.github.io/MeloHeal",
           font=load_font(26 * s, 400), fill=INDIGO, anchor="ra")

    # 右上角胶囊：PWA 能力
    pill_font = load_font(24 * s, 500)
    label = "PWA · 可安装 · 离线可用"
    tw = pill_font.getlength(label)
    px1, py1 = W - 88 * s, 74 * s
    px0, py0 = px1 - tw - 40 * s, py1
    d.rounded_rectangle([px0, py0, px1, py1 + 48 * s], radius=24 * s,
                        fill=(237, 235, 247, 255))
    d.text(((px0 + px1) / 2, py0 + 24 * s), label, font=pill_font,
           fill=INDIGO, anchor="mm")

    return bg.convert("RGB").resize((w, h), Image.LANCZOS)


def main():
    os.makedirs(ICONS, exist_ok=True)
    plan = [
        (os.path.join(ICONS, "favicon-32.png"), 32, False, 1.0),
        (os.path.join(ICONS, "apple-touch-icon.png"), 180, True, 0.80),
        (os.path.join(ICONS, "icon-192.png"), 192, False, 1.0),
        (os.path.join(ICONS, "icon-512.png"), 512, False, 1.0),
        (os.path.join(ICONS, "icon-maskable-512.png"), 512, True, 0.60),
    ]
    total = 0
    for path, size, full_bleed, ratio in plan:
        img = render_icon(size, full_bleed=full_bleed, mark_ratio=ratio)
        img.save(path, "PNG", optimize=True)
        n = os.path.getsize(path)
        total += n
        print(f"  [OK] {os.path.relpath(path, ROOT).replace(os.sep, '/')}"
              f" — {size}×{size}, {n:,} 字节")

    og_path = os.path.join(PUBLIC, "og-image.png")
    build_og_image().save(og_path, "PNG", optimize=True)
    n = os.path.getsize(og_path)
    total += n
    print(f"  [OK] public/og-image.png — 1200×630, {n:,} 字节")
    print(f"图标与分享图全部生成完毕，合计 {total:,} 字节")
    return 0


if __name__ == "__main__":
    sys.exit(main())
