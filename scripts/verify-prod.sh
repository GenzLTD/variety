#!/usr/bin/env bash
# =============================================================
# verify-prod.sh — 生产验收断言（在目标机上跑）
#
# 定位：这是「本次部署是否真的达成验收口径」的断言集，不是体检报告。
#   - 断言全部针对 127.0.0.1，用 --resolve 保持真实 Host/SNI，结论不依赖公网出口。
#   - 加 --public 再按真实 DNS 走一遍（验 DNS / 链路，属 L3）。
#
# 由来：Run #14「流水线成功但本次功能发布未通过验收」暴露出旧检查只 curl 了
#   http://127.0.0.1:8080（WP 存活）与门户 HTTP 200 —— 而「HTTP 200」在
#   WordPress 默认页与 SPA index.html 两种情况下都为真，HTTPS 更是一项断言都没有。
#   本脚本把「必须是门户」「必须是 HTTPS」「续期通道必须通」写成硬断言。
#
# 用法：
#   bash scripts/verify-prod.sh              # 本机回环（推荐，作为部署门禁）
#   bash scripts/verify-prod.sh --public     # 追加公网 DNS 路径
#
# 退出码：0 = 全部通过；1 = 有断言失败（本次部署不得判成功）
# =============================================================
set -uo pipefail

HOST="${PORTAL_HOST:-szbolent.cn}"
HOST_WWW="www.${HOST}"
WP_PORT="${WP_PORT:-8080}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/00-szbolent.conf}"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/${HOST}}"
ACME_WEBROOT="${ACME_WEBROOT:-/var/www/certbot}"
PORTAL_DIST="${PORTAL_DIST:-/var/www/szbolent-portal/dist}"
ENV_FILES="${ENV_FILES:-/opt/szbolent-cn/.env /opt/bolent-wp/.env}"
CERT_MIN_DAYS="${CERT_MIN_DAYS:-20}"

# Actions Run #14 部署日志里明文打印过的两个库口令（podman-compose 回显的
# `podman run -e MYSQL_ROOT_PASSWORD=... -e MYSQL_PASSWORD=...`）。
# 这里只存 sha256 前缀：既能当回归门禁，又不把口令再写进仓库。
LEAKED_SHA16="9da003569bee79ec 3946ee93c37201b3"

PUBLIC=0
for arg in "$@"; do
  case "$arg" in
    --public) PUBLIC=1 ;;
    -h|--help) sed -n '2,23p' "$0"; exit 0 ;;
    *) echo "未知参数: $arg（可用: --public）" >&2; exit 2 ;;
  esac
done

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; DIM='\033[2m'; NC='\033[0m'
PASS=0; FAIL=0
FAILED_NAMES=""

ok()   { printf "  ${GREEN}✅ PASS${NC}  %s\n" "$1"; PASS=$((PASS + 1)); }
no()   { printf "  ${RED}❌ FAIL${NC}  %s\n" "$1"; FAIL=$((FAIL + 1)); FAILED_NAMES="${FAILED_NAMES}${1}; "; }
skip() { printf "  ${YELLOW}⏭  SKIP${NC}  %s\n" "$1"; }

# 回环请求：保持真实 Host/SNI，但强制解析到 127.0.0.1，不受 DNS/防火墙影响
creq() { curl -sS -m 15 \
  --resolve "${HOST}:443:127.0.0.1" --resolve "${HOST_WWW}:443:127.0.0.1" \
  --resolve "${HOST}:80:127.0.0.1"  --resolve "${HOST_WWW}:80:127.0.0.1" "$@"; }
ccode() { creq -o /dev/null -w '%{http_code}' "$@"; }

echo ""
echo "============================================"
echo "  门户生产验收断言"
echo "  $(date '+%Y-%m-%d %H:%M:%S')  host=${HOST}"
echo "============================================"
echo ""

# ── 1. nginx 配置层：缺 443 就是这次事故的原始形态 ────────────
echo "--- 1. nginx 配置 ---"
if nginx -t >/dev/null 2>&1; then
  ok "nginx -t 语法通过"
else
  no "nginx -t 语法失败: $(nginx -t 2>&1 | tail -1)"
fi

if [ -f "$NGINX_CONF" ]; then
  if grep -q 'listen 443 ssl' "$NGINX_CONF"; then
    ok "现役配置含 listen 443 ssl"
  else
    no "现役配置没有 443 —— 门户外层 TLS 未接入（文件: $NGINX_CONF）"
  fi
  if grep -q 'acme-challenge' "$NGINX_CONF"; then
    ok "现役配置含 ACME 校验通道（续期命门）"
  else
    no "现役配置缺 /.well-known/acme-challenge/ —— 证书将无法续期"
  fi
  if grep -q "root ${PORTAL_DIST}" "$NGINX_CONF"; then
    ok "location / 指向门户产物 ${PORTAL_DIST}"
  else
    no "location / 未指向门户产物（SPA 不会接管首页）"
  fi
  if grep -q 'try_files' "$NGINX_CONF"; then
    ok "location / 有 try_files 回退（深链接不会 404）"
  else
    no "location / 缺 try_files：/blog 这类深链接会 404"
  fi
  for p in /wp-json /wp-admin /wp-content; do
    if grep -q "location ${p}" "$NGINX_CONF"; then
      ok "WP 保留通道存在: ${p}"
    else
      no "缺 location ${p}：门户接管 / 后该通道不再可达"
    fi
  done
else
  no "找不到现役配置 $NGINX_CONF"
fi

if ss -ltn 2>/dev/null | grep -qE ':443\b'; then ok ":443 正在监听"; else no ":443 未监听"; fi

# ── 2. 证书 ───────────────────────────────────────────────────
echo ""
echo "--- 2. 证书 ---"
if [ -s "${CERT_DIR}/fullchain.pem" ]; then
  ok "证书文件存在: ${CERT_DIR}/fullchain.pem"

  END_TS=$(openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$END_TS" ]; then
    END_EPOCH=$(date -d "$END_TS" +%s 2>/dev/null || echo 0)
    DAYS=$(( (END_EPOCH - $(date +%s)) / 86400 ))
    if [ "$DAYS" -ge "$CERT_MIN_DAYS" ]; then
      ok "证书剩余有效期 ${DAYS} 天（≥${CERT_MIN_DAYS}）"
    else
      no "证书仅剩 ${DAYS} 天（<${CERT_MIN_DAYS}）—— 续期通道大概率不通"
    fi
  else
    no "无法解析证书有效期"
  fi

  SAN_MISSING=""
  for d in "$HOST" "$HOST_WWW"; do
    openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -text 2>/dev/null \
      | grep -A2 'Subject Alternative Name' | grep -q "DNS:${d}\b" || SAN_MISSING="${SAN_MISSING} ${d}"
  done
  if [ -z "$SAN_MISSING" ]; then
    ok "证书 SAN 覆盖 ${HOST} / ${HOST_WWW}"
  else
    no "证书 SAN 未覆盖:${SAN_MISSING}"
  fi

  # 线上真正提供的证书必须与磁盘上这份一致（防「装了新配置但没 reload 成功」）
  SERVED=$(echo | timeout 8 openssl s_client -connect 127.0.0.1:443 -servername "$HOST" 2>/dev/null \
            | openssl x509 -noout -fingerprint -sha256 2>/dev/null)
  ONDISK=$(openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -fingerprint -sha256 2>/dev/null)
  if [ -n "$SERVED" ] && [ "$SERVED" = "$ONDISK" ]; then
    ok ":443 实际提供的证书与磁盘一致"
  elif [ -z "$SERVED" ]; then
    no ":443 握手失败或证书读不到（TLS 未真正生效）"
  else
    no ":443 提供的证书与 ${CERT_DIR}/fullchain.pem 不一致"
  fi
else
  no "证书文件不存在: ${CERT_DIR}/fullchain.pem"
fi

if systemctl is-active certbot-renew.timer >/dev/null 2>&1; then
  ok "certbot-renew.timer 在跑（到期前会自动续）"
else
  no "certbot-renew.timer 未运行 —— 证书到期即全站 HTTPS 挂掉"
fi

# ── 3. 门户本体（HTTPS）───────────────────────────────────────
echo ""
echo "--- 3. 门户（HTTPS）---"
BODY=$(creq "https://${HOST}/" 2>/dev/null || echo "")
CODE=$(ccode "https://${HOST}/")
if [ "$CODE" = "200" ]; then ok "https://${HOST}/ → 200"; else no "https://${HOST}/ → ${CODE:-000}"; fi

if printf '%s' "$BODY" | grep -q '<div id="app">'; then
  ok "首页含 Vue 挂载点（门户产物真的发布了）"
else
  no "首页不含 Vue 挂载点 —— 门户没有发布，或 location / 仍回源 WP"
fi

# 反向断言：绝不能是 WordPress 默认页（Run #14 线上就是这个）
if printf '%s' "$BODY" | grep -qiE '<title>Blog</title>|/wp-content/themes/twentytwenty'; then
  no "首页是 WordPress 默认页（<title>Blog</title> / 默认主题）—— 等于没发布"
else
  ok "首页不是 WP 默认页"
fi

# 深链接：SPA 回退必须生效，否则 /blog 直接刷新即 404
for p in /blog /about /services /contact; do
  C=$(ccode "https://${HOST}${p}")
  B=$(creq "https://${HOST}${p}" 2>/dev/null || echo "")
  if [ "$C" = "200" ] && printf '%s' "$B" | grep -q '<div id="app">'; then
    ok "深链接 ${p} → 200 且含挂载点（SPA 回退生效）"
  else
    no "深链接 ${p} → ${C:-000}（应为 200 且含挂载点）"
  fi
done

# 首页引用的第一个构建产物必须能取回，否则页面白屏
ASSET=$(printf '%s' "$BODY" | grep -oE '/assets/[A-Za-z0-9._-]+\.(js|css)' | head -1)
if [ -n "$ASSET" ]; then
  AC=$(ccode "https://${HOST}${ASSET}")
  if [ "$AC" = "200" ]; then ok "构建产物可访问: ${ASSET}"; else no "构建产物取不回来: ${ASSET} → ${AC:-000}"; fi
else
  no "首页里找不到 /assets/ 构建产物引用（dist 可能是空的或旧的）"
fi

# ── 4. HTTP → HTTPS 升级 ─────────────────────────────────────
echo ""
echo "--- 4. HTTP 升级到 HTTPS ---"
for h in "$HOST" "$HOST_WWW"; do
  C=$(creq -o /dev/null -w '%{http_code}' "http://${h}/")
  L=$(creq -o /dev/null -w '%{redirect_url}' "http://${h}/")
  if [ "$C" = "301" ] && printf '%s' "$L" | grep -q "^https://${h}"; then
    ok "http://${h}/ → 301 ${L}"
  else
    no "http://${h}/ 未正确升级（code=${C:-000} location=${L:-none}）"
  fi
done

# ACME 通道真可达：放一个 token 再取回来（不猜，实测；这是续期失败的唯一先兆）
TOKEN="variety-acme-probe-$(date +%s)"
mkdir -p "${ACME_WEBROOT}/.well-known/acme-challenge" 2>/dev/null
if printf '%s' "$TOKEN" > "${ACME_WEBROOT}/.well-known/acme-challenge/${TOKEN}" 2>/dev/null; then
  GOT=$(creq "http://${HOST}/.well-known/acme-challenge/${TOKEN}" 2>/dev/null || echo "")
  rm -f "${ACME_WEBROOT}/.well-known/acme-challenge/${TOKEN}"
  if [ "$GOT" = "$TOKEN" ]; then
    ok "ACME 校验通道可达（.well-known 实测取回一致）"
  else
    no "ACME 校验通道不可达（取回='${GOT}'）—— 证书续期会失败"
  fi
else
  skip "ACME 通道实测（无写权限: ${ACME_WEBROOT}）"
fi

# ── 5. WP 保留通道 ───────────────────────────────────────────
echo ""
echo "--- 5. WordPress 保留通道 ---"
WPJSON=$(creq "https://${HOST}/wp-json/" 2>/dev/null || echo "")
# 注意 JSON 转义：WP 返回的命名空间是 `wp\/v2`（斜杠被转义），
# 早先这里 grep 的是 `wp/v2` → 接口明明正常也判 FAIL（假阴性）。
# 用 ERE 同时接受 `wp\/v2` 与 `wp/v2`，并要求它出现在 namespaces 字段里，
# 以免退化成「随便一个含 wp/v2 的响应都算过」。
if printf '%s' "$WPJSON" | grep -qE '"namespaces":\[[^]]*wp\\?/v2'; then
  ok "/wp-json/ 返回 REST 索引（博客数据源在）"
else
  no "/wp-json/ 没返回 REST 索引（博客页会空）"
fi

C=$(ccode "https://${HOST}/wp-admin/")
if [ "$C" = "200" ] || [ "$C" = "301" ] || [ "$C" = "302" ]; then
  ok "/wp-admin/ → ${C}（后台通道保留）"
else
  no "/wp-admin/ → ${C:-000}（后台通道断了）"
fi

# 跟随后必须仍落在 https://<本域> 上。若跳到 http:// 或裸 IP，说明 WP_HOME/
# WP_SITEURL 还是旧值（http://<IP>）—— 那样浏览器会拿到证书不匹配的地址，
# 后台等于进不去。这条断言就是为此设的。
ADMIN=$(creq -L -o /dev/null -w '%{url_effective} %{http_code}' "https://${HOST}/wp-admin/" 2>/dev/null)
read -r ADMIN_URL ADMIN_CODE <<< "$ADMIN"
if printf '%s' "$ADMIN_URL" | grep -q "^https://${HOST}" && [ "$ADMIN_CODE" = "200" ]; then
  ok "/wp-admin/ 跟随后落在 ${ADMIN_URL} → 200（站点地址口径是 https://${HOST}）"
else
  no "/wp-admin/ 跟随后落在 ${ADMIN_URL:-?} → ${ADMIN_CODE:-?}（期望 https://${HOST}/… → 200；若跳到 IP 或 http:// 则是 WP_HOME/WP_SITEURL 未改为 https://${HOST}）"
fi

C=$(ccode "https://${HOST}/wp-content/")
if printf '%s' "$C" | grep -qE '^(2|3|4)'; then
  ok "/wp-content/ → ${C}（媒体通道保留；403/404 属禁目录列表，正常）"
else
  no "/wp-content/ → ${C:-000}（媒体通道断了，文章配图会碎）"
fi

# ── 6. 代理分流 ──────────────────────────────────────────────
echo ""
echo "--- 6. 代理分流 ---"
C=$(ccode "https://${HOST}/v1/")
if [ "$C" = "502" ] || [ "$C" = "504" ]; then
  no "/v1 → ${C}（Looma 上游不可达）"
else
  ok "/v1 → ${C}（非 502/504）"
fi
C=$(ccode "https://${HOST}/v1/menus?product=szbolent")
if [ "$C" = "502" ] || [ "$C" = "504" ]; then
  no "/v1/menus → ${C}（Page Engine 上游不可达）"
else
  ok "/v1/menus → ${C}（非 502/504）"
fi

# ── 7. 口令卫生（Run #14 日志泄露的回归门禁）──────────────────
echo ""
echo "--- 7. 口令卫生 ---"
for f in $ENV_FILES; do
  [ -f "$f" ] || { skip "口令卫生（不存在: $f）"; continue; }
  MODE=$(stat -c '%a' "$f" 2>/dev/null || echo '?')
  if [ "$MODE" = "600" ] || [ "$MODE" = "400" ]; then
    ok "$f 权限 ${MODE}"
  else
    no "$f 权限 ${MODE}（应 ≤600：同机任意用户可读即等于泄露）"
  fi

  BAD=0
  while IFS= read -r line; do
    case "$line" in
      MYSQL_ROOT_PASSWORD=*|MYSQL_PASSWORD=*|PGVECTOR_PASSWORD=*)
        v="${line#*=}"
        [ -n "$v" ] || continue
        h=$(printf '%s' "$v" | sha256sum | cut -c1-16)
        for bad in $LEAKED_SHA16; do
          [ "$h" = "$bad" ] && BAD=1
        done
        ;;
    esac
  done < "$f"
  if [ "$BAD" = 1 ]; then
    no "$f 仍在用 Run #14 日志里泄露过的口令（必须已轮换）"
  else
    ok "$f 不含已知泄露口令"
  fi
done

# .env 里写了 ≠ 容器里生效了。这两者不一致时，下次重建容器就会用上新口令 ——
# 而 MySQL 里还是旧口令，WordPress 直接连不上库。
if command -v podman >/dev/null 2>&1 && podman container exists bolent_wp_mysql 2>/dev/null; then
  LIVE_ROOT=$(podman exec bolent_wp_mysql printenv MYSQL_ROOT_PASSWORD 2>/dev/null || echo "")
  ENVF="/opt/szbolent-cn/.env"
  if [ -f "$ENVF" ] && [ -n "$LIVE_ROOT" ]; then
    FILE_ROOT=$(grep -E '^MYSQL_ROOT_PASSWORD=' "$ENVF" | head -1 | cut -d= -f2-)
    if [ "$(printf '%s' "$LIVE_ROOT" | sha256sum | cut -c1-16)" = "$(printf '%s' "$FILE_ROOT" | sha256sum | cut -c1-16)" ]; then
      ok "容器内生效口令与 $ENVF 一致"
    else
      no "容器内生效口令与 $ENVF 不一致（改了 .env 但容器未重建）"
    fi
  fi

  if podman exec bolent_wp_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin ping -h localhost -uroot' 2>/dev/null | grep -q alive; then
    ok "MySQL 存活（用容器内口令自测）"
  else
    no "MySQL 用容器内口令自测失败"
  fi
else
  skip "MySQL 容器（未找到 podman 或容器）"
fi

# ── 8. 公网路径（可选）───────────────────────────────────────
if [ "$PUBLIC" = 1 ]; then
  echo ""
  echo "--- 8. 公网路径 ---"
  C=$(curl -sS -m 15 -o /dev/null -w '%{http_code}' "https://${HOST}/" 2>/dev/null || echo 000)
  if [ "$C" = "200" ]; then ok "公网 https://${HOST}/ → 200"; else no "公网 https://${HOST}/ → ${C}"; fi
  C=$(curl -sS -m 15 -o /dev/null -w '%{http_code}' "http://${HOST_WWW}/" 2>/dev/null || echo 000)
  if [ "$C" = "301" ] || [ "$C" = "308" ]; then
    ok "公网 http://${HOST_WWW}/ → ${C}"
  else
    no "公网 http://${HOST_WWW}/ → ${C}（应为 301/308）"
  fi
fi

echo ""
echo "============================================"
printf "  通过: ${GREEN}%d${NC}   失败: ${RED}%d${NC}\n" "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf "  失败项: %s\n" "$FAILED_NAMES"
  echo "============================================"
  echo ""
  echo -e "${RED}验收未通过 —— 本次部署不得判成功。${NC}"
  echo "排查顺序："
  echo "  1) 门户有没有发布  → ls -l ${PORTAL_DIST}/index.html"
  echo "  2) 配置有没有生效  → nginx -T | grep -E 'listen 443|try_files'"
  echo "  3) 证书有没有      → certbot certificates"
  exit 1
fi
echo "============================================"
echo ""
echo -e "${GREEN}验收通过：门户已发布、HTTPS 生效、续期通道在。${NC}"
exit 0
