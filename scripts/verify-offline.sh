#!/usr/bin/env bash
# ============================================================
# verify-offline.sh — 离线可验证断言（L1 契约同步 + L2 构建/类型）
#
# 口径：本脚本只做「不依赖本机拓扑」的断言。
#   成员 clone 后只需 node + npm ci，不需要 Docker / nginx / ServBay，
#   也不需要任何上游服务在跑，即可得到与维护者一致的结论。
#
# 刻意不在此脚本内（属 L3：结论随环境而变，只能算「某人本机自测」）：
#   - 本地栈 + 分流冒烟        →  docker compose + bash scripts/smoke.sh
#   - Page Engine 集成测试     →  bash backend/test-integration.sh   （需 :5300 在跑）
#   - 生产回执（打公网 + SSH）  →  bash scripts/report-prod.sh
#
# 退出码（三级，务必区分「断言失败」与「环境不足」）：
#   0 = 请求的断言全部通过
#   1 = 断言失败（仓的问题）
#   2 = 环境不足，有事没跑成（缺 node / npm / node_modules / chromium）→ SKIPPED ≠ 失败
#
# 用法：
#   bash scripts/verify-offline.sh                # L1 + L2
#   bash scripts/verify-offline.sh --with-tests   # 追加 vitest（需 playwright chromium）
#
# node 版本：本仓在 .nvmrc 声明的版本上验证。实际大版本不符时仅 WARN 并继续执行，
#   但此时结论不可与维护者逐字比对（回执行会标注）。
# ============================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_TESTS=0
for arg in "$@"; do
  case "$arg" in
    --with-tests) WITH_TESTS=1 ;;
    -h|--help) sed -n '2,26p' "$0"; exit 0 ;;
    *) echo "未知参数: $arg（可用: --with-tests）" >&2; exit 2 ;;
  esac
done

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; DIM='\033[2m'; NC='\033[0m'

FAILED=0
SKIPPED=0
RECEIPT=""
SHOW_OUTPUT=0

pass() { printf "  ${GREEN}✓ PASS${NC}  %s\n" "$1"; RECEIPT="${RECEIPT:+$RECEIPT | }$2 ✓"; }
fail() { printf "  ${RED}✗ FAIL${NC}  %s\n" "$1"; RECEIPT="${RECEIPT:+$RECEIPT | }$2 ✗"; FAILED=$((FAILED + 1)); }
skip() { printf "  ${YELLOW}⏭ SKIP${NC}  %s\n" "$1"; RECEIPT="${RECEIPT:+$RECEIPT | }$2 SKIP"; SKIPPED=$((SKIPPED + 1)); }

run() {  # run <描述> <回执键> <命令...>
  local desc="$1" key="$2"; shift 2
  local out
  if out="$("$@" 2>&1)"; then
    pass "$desc" "$key"
    if [ "$SHOW_OUTPUT" = 1 ] && [ -n "$out" ]; then
      printf '%s\n' "$out" | sed 's/^/      /'
    fi
  else
    fail "$desc" "$key"
    printf '%s\n' "$out" | tail -n 25 | sed 's/^/      /'
  fi
}

SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'no-git')"

printf "\n============================================\n"
printf "  verify-offline — 离线可验证断言\n"
printf "  %s  @ %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$SHA"
printf "============================================\n"

# ── 环境前检：只判「能不能验」，不下断言 ─────────────────────
if ! command -v node >/dev/null 2>&1; then
  printf "\n${YELLOW}环境不足${NC}：未找到 node。\n"
  printf "  本仓 pin 的版本见 .nvmrc。装好后重跑本脚本。\n\n"
  exit 2
fi
if ! command -v npm >/dev/null 2>&1; then
  printf "\n${YELLOW}环境不足${NC}：未找到 npm（应随 node 一同安装）。\n\n"
  exit 2
fi

NODE_ACTUAL="$(node -v)"
NODE_MAJOR="${NODE_ACTUAL#v}"; NODE_MAJOR="${NODE_MAJOR%%.*}"
NODE_RECEIPT="node=${NODE_ACTUAL}"
if [ -f "$ROOT/.nvmrc" ]; then
  NODE_PIN="$(tr -d 'v \t\r\n' < "$ROOT/.nvmrc")"
  if [ "${NODE_PIN%%.*}" != "$NODE_MAJOR" ]; then
    NODE_RECEIPT="node=${NODE_ACTUAL}(!=pin ${NODE_PIN})"
    printf "\n  ${YELLOW}!${NC} node 大版本与 .nvmrc 不符：实际 %s，pin %s\n" "$NODE_ACTUAL" "$NODE_PIN"
    printf "    继续执行，但结论不可与维护者逐字比对；建议先 nvm use\n"
  fi
fi

# ── L1：契约同步（零依赖，纯文件运算）───────────────────────
printf "\n--- L1 契约同步（零依赖，只读文件）---\n"
SHOW_OUTPUT=1
run "契约 → nginx 产物同步 (nginx.conf / nginx-api.genz.ltd.conf)" contracts \
    node scripts/gen-entry.mjs --check
SHOW_OUTPUT=0

# ── L1+：入口契约的「必须有」断言 ────────────────────────────
# 都对应实际发生过的缺口：门户产物从未接管 /、HTTPS 从未在门户外层生效、
# ACME 通道缺失会让续期静默失败。这些都能离线断言，就不该留给人眼。
printf "\n--- L1+ 入口契约必须项（离线可断言）---\n"
SHOW_OUTPUT=1
run "入口配置含 443/TLS" entry_tls \
    grep -q 'listen 443 ssl' nginx.conf
run "入口配置含 ACME 校验通道（证书可续期）" entry_acme \
    grep -q '\.well-known/acme-challenge/' nginx.conf
run "入口配置把 / 交给门户产物（root dist + try_files 回退）" entry_static \
    bash -c 'grep -q "root /var/www/szbolent-portal/dist" nginx.conf && grep -q "try_files" nginx.conf'
run "WP 保留通道齐全（/wp-json /wp-admin /wp-content）" entry_wp \
    bash -c 'for p in /wp-json /wp-admin /wp-content; do grep -q "location $p" nginx.conf || exit 1; done'
# 引导态必须是「不含 ssl_certificate 指令」的：证书没签发时它也得能装上去。
# 只匹配行首指令，不匹配注释里提到的同类字样（注释里有这个词，见上文注释）。
run "TLS 引导态可生成且不含 ssl_certificate 指令" entry_bootstrap \
    bash -c 'out=$(node scripts/gen-entry.mjs --http-only) && printf %s "$out" | grep -q "acme-challenge" && ! printf %s "$out" | grep -qE "^[[:space:]]*ssl_certificate"'
SHOW_OUTPUT=0

# ── L2：构建 / 类型（依赖 node_modules，版本由 package-lock.json 锁定）──
printf "\n--- L2 构建 / 类型（依赖 node_modules）---\n"
if [ ! -d "$ROOT/node_modules" ]; then
  skip "TypeScript 类型检查（缺 node_modules）" typecheck
  skip "生产构建（缺 node_modules）" build
  printf "      ${DIM}请先执行: npm ci   （锁文件已入库，安装结果可复现）${NC}\n"
else
  run "TypeScript 类型检查 (npm run typecheck)" typecheck npm run typecheck
  run "生产构建 (npm run build → dist/)" build npm run build
fi

# ── L2+：组件/Story 测试（浏览器模式，需 chromium，故默认不跑）──
if [ "$WITH_TESTS" = 1 ]; then
  printf "\n--- L2+ 组件/Story 测试（--with-tests）---\n"
  CHROMIUM=0
  for d in "$HOME/Library/Caches/ms-playwright" "$HOME/.cache/ms-playwright"; do
    if [ -d "$d" ] && ls "$d" 2>/dev/null | grep -q '^chromium'; then CHROMIUM=1; fi
  done
  if [ "$CHROMIUM" = 1 ]; then
    run "vitest（storybook 浏览器模式 / chromium）" tests npm test
  else
    skip "vitest 需 playwright chromium" tests
    printf "      ${DIM}请先执行: npx playwright install chromium${NC}\n"
  fi
fi

# ── 回执 ────────────────────────────────────────────────────
printf "\n============================================\n"
printf "  Verified-Offline @ %s: %s\n" "$SHA" "$RECEIPT"
printf "  %s\n" "$NODE_RECEIPT"
printf "============================================\n"

if [ "$FAILED" -gt 0 ]; then
  printf "  ${RED}%d 项断言失败${NC} —— 这是仓的问题，不是环境问题。\n\n" "$FAILED"
  exit 1
fi
if [ "$SKIPPED" -gt 0 ]; then
  printf "  ${YELLOW}%d 项因环境不足未执行（SKIPPED ≠ 失败）${NC}\n" "$SKIPPED"
  printf "  按上面的提示补齐环境后重跑，才能得到可提交的结论。\n\n"
  exit 2
fi
printf "  ${GREEN}离线断言全部通过${NC} —— 本仓的契约 / 类型 / 构建断言成立。\n"
printf "  ${DIM}注意：这不代表服务能跑。上游戏依赖 Docker + 外部上游，属 L3，见脚本头。${NC}\n\n"
exit 0
