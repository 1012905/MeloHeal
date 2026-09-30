#!/usr/bin/env bash
# ==========================================================================
# 一键发布到 GitHub Pages —— 音愈时光 MeloHeal
#
#   本地自检（测试 → 构建 → 产物校验）→ 提交 → 推送 main → GitHub Actions 部署
#
# 用法：
#   bash scripts/deploy-pages.sh            # 交互确认后推送
#   bash scripts/deploy-pages.sh -y         # 跳过确认
#   bash scripts/deploy-pages.sh --dry-run  # 只做本地自检与构建，不提交不推送
#   bash scripts/deploy-pages.sh --skip-tests
#
# 需要：Git Bash / Linux / macOS + Node 20+。Windows 下请在 Git Bash 里跑。
# ==========================================================================
set -euo pipefail

REPO_SLUG="1012905/MeloHeal"
PAGES_URL="https://1012905.github.io/MeloHeal/"
BRANCH="main"

ASSUME_YES=0
DRY_RUN=0
SKIP_TESTS=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes)      ASSUME_YES=1 ;;
    --dry-run)     DRY_RUN=1 ;;
    --skip-tests)  SKIP_TESTS=1 ;;
    -h|--help)     sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "未知参数：$arg（用 --help 查看用法）" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."
echo "▸ 仓库目录：$(pwd)"

# ── 0. 环境检查 ───────────────────────────────────────────────────────────
command -v node >/dev/null || { echo "✗ 找不到 node" >&2; exit 1; }
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || { echo "✗ 需要 Node 20+，当前 $(node -v)" >&2; exit 1; }

if [ "$DRY_RUN" -eq 0 ]; then
  command -v git >/dev/null || { echo "✗ 找不到 git" >&2; exit 1; }
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  [ "$CURRENT_BRANCH" = "$BRANCH" ] || { echo "✗ 当前分支是 $CURRENT_BRANCH，请先切到 $BRANCH" >&2; exit 1; }
fi

# ── 1. 依赖 ───────────────────────────────────────────────────────────────
if [ ! -d node_modules ]; then
  echo "▸ 安装依赖（npm ci）"
  npm ci
fi

# ── 2. 测试 ───────────────────────────────────────────────────────────────
if [ "$SKIP_TESTS" -eq 0 ]; then
  echo "▸ 单元测试"
  npm test
fi

# ── 3. 构建 ───────────────────────────────────────────────────────────────
echo "▸ 构建（npm run build → dist/）"
rm -rf dist
npm run build

# ── 4. 产物校验：PWA 资源齐全 + 应用外壳零外部资源 ─────────────────────────
echo "▸ 校验产物"
MISSING=0
for f in dist/index.html dist/manifest.webmanifest dist/sw.js dist/favicon.svg \
         dist/og-image.png dist/icons/favicon-32.png dist/icons/apple-touch-icon.png \
         dist/icons/icon-192.png dist/icons/icon-512.png dist/icons/icon-maskable-512.png \
         dist/fonts/fonts.css dist/fonts/inter-latin.woff2 dist/fonts/noto-sans-sc-subset.woff2; do
  if [ -f "$f" ]; then
    printf '  ✓ %s\n' "$f"
  else
    printf '  ✗ 缺少 %s\n' "$f"; MISSING=1
  fi
done
[ "$MISSING" -eq 0 ] || { echo "✗ 产物不完整，已中止" >&2; exit 1; }

if grep -Eq 'fonts\.googleapis\.com|fonts\.gstatic\.com' dist/index.html; then
  echo "✗ dist/index.html 仍引用外部字体 CDN" >&2; exit 1
fi
echo "  ✓ 无外部字体 CDN 引用"
echo "  ▸ dist 体积：$(du -sh dist | cut -f1)（index.html $(wc -c < dist/index.html | tr -d ' ') 字节）"

if [ "$DRY_RUN" -eq 1 ]; then
  echo "▸ --dry-run：跳过提交与推送。产物在 dist/，可本地 preview 检查。"
  exit 0
fi

# ── 5. 提交并推送 ─────────────────────────────────────────────────────────
if [ -z "$(git status --porcelain)" ]; then
  echo "▸ 工作区干净，没有需要提交的改动；将直接推送以触发 Actions 重新部署。"
else
  git status --short
  if [ "$ASSUME_YES" -eq 0 ]; then
    read -r -p "提交以上改动并推送到 origin/$BRANCH？[y/N] " reply
    case "$reply" in [yY]|[yY][eE][sS]) ;; *) echo "已取消。"; exit 0 ;; esac
  fi
  git add -A
  git commit -m "chore(deploy): 发布站点更新 $(date '+%Y-%m-%d %H:%M')"
fi

git push origin "$BRANCH"

echo
echo "✓ 已推送到 origin/$BRANCH"
echo "  Actions：https://github.com/$REPO_SLUG/actions/workflows/deploy-pages.yml"
echo "  站点：  $PAGES_URL"
echo "  提示：Service Worker 有缓存，发布后若界面未更新请强制刷新（Ctrl/Cmd+Shift+R）。"
