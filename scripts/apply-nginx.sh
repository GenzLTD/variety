#!/usr/bin/env bash
# =============================================================
# apply-nginx.sh — 在目标机（root）安装门户 nginx 配置 + 确保 TLS 就绪
#
# 运行位置：服务器（由 .github/workflows/deploy.yml 推上去执行）
# 用法：
#   bash apply-nginx.sh \
#     --http-only  /var/www/szbolent-portal/nginx/szbolent.http-only.conf \
#     --full       /var/www/szbolent-portal/nginx/szbolent.conf.new \
#     --dst        /etc/nginx/conf.d/00-szbolent.conf \
#     --cert-name  szbolent.cn \
#     --cert-dir   /etc/letsencrypt/live/szbolent.cn \
#     --acme-webroot /var/www/certbot \
#     --domains    "szbolent.cn www.szbolent.cn" \
#     --email      admin@szbolent.cn
#
# 为什么必须分两步装（顺序不能换，换了就出事故）：
#   --full 里含 ssl_certificate 指向的证书文件。证书还没签发时直接装 full，
#   nginx -t 会失败；若此刻再执行 reload/restart，nginx 会拒绝起新 worker，
#   :80 也跟着一起挂。所以先装 --http-only（:80 正常服务 + ACME 通道），
#   签发成功后再换 --full。
#
# 幂等：证书存在且 SAN 覆盖目标域时，走 certbot renew（未临期自动跳过）；
# 证书缺失或 SAN 不足时走 certbot certonly --expand（域集合变大必须重签，
# 用 --keep-until-expiring 会因「未临期」跳过 → www 永远进不来）。
# 配置无变化时不 reload。任何一次 nginx -t 失败都会回滚到备份。
# =============================================================
set -euo pipefail

HTTP_ONLY_CONF=""
FULL_CONF=""
DST="/etc/nginx/conf.d/00-szbolent.conf"
CERT_NAME=""
CERT_DIR=""
ACME_WEBROOT="/var/www/certbot"
DOMAINS=""
EMAIL=""

while [ $# -gt 0 ]; do
  case "$1" in
    --http-only)    HTTP_ONLY_CONF="$2"; shift 2 ;;
    --full)         FULL_CONF="$2"; shift 2 ;;
    --dst)          DST="$2"; shift 2 ;;
    --cert-name)    CERT_NAME="$2"; shift 2 ;;
    --cert-dir)     CERT_DIR="$2"; shift 2 ;;
    --acme-webroot) ACME_WEBROOT="$2"; shift 2 ;;
    --domains)      DOMAINS="$2"; shift 2 ;;
    --email)        EMAIL="$2"; shift 2 ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
done

log()  { echo "[apply-nginx] $*"; }
warn() { echo "[apply-nginx] ⚠️  $*" >&2; }
die()  { warn "$*"; exit 1; }

[ -n "$CERT_NAME" ] || die "缺少 --cert-name"
[ -n "$DOMAINS" ]   || die "缺少 --domains"
[ -n "$FULL_CONF" ] || die "缺少 --full"
[ -f "$FULL_CONF" ] || die "--full 指的文件不存在: $FULL_CONF"

# ── 本机 nginx 的重载方式：systemctl reload nginx 在本机不生效（实证），
#    只有 nginx -s reload 会让新 worker 起来。续期 hook 也是这么写的。
reload_nginx() {
  if nginx -s reload 2>/dev/null; then
    log "nginx 已 reload（nginx -s reload）"
  elif systemctl reload nginx 2>/dev/null; then
    log "nginx 已 reload（systemctl reload nginx）"
  else
    die "reload 失败：nginx -s reload 与 systemctl reload 都不成功"
  fi
}

timestamp() { date '+%Y%m%d%H%M%S'; }

# 安装配置：先落盘 → 语法校验 → 通过才 reload；不通过立刻回滚。
install_conf() {
  local src="$1" label="$2"
  local bak=""
  if [ -f "$DST" ] && ! cmp -s "$src" "$DST"; then
    bak="${DST}.bak.${label}.$(timestamp)"
    cp -p "$DST" "$bak"
    log "已备份原配置 → $bak"
  fi
  install -m 0644 "$src" "$DST"

  if ! nginx -t 2>&1 | sed 's/^/[apply-nginx]   /'; then
    if [ -n "$bak" ]; then
      cp -p "$bak" "$DST"
      warn "nginx -t 失败，已回滚到 $bak"
    else
      warn "nginx -t 失败，且无备份可回滚（$DST 是新建文件）"
      rm -f "$DST"
    fi
    die "拒绝 reload：配置语法不通过（$label）"
  fi
  reload_nginx
}

# ACME webroot 必须存在且可读，否则 certbot 静默失败 → 到期全站 HTTPS 挂掉
mkdir -p "${ACME_WEBROOT}/.well-known/acme-challenge"
chmod 0755 "$ACME_WEBROOT" "${ACME_WEBROOT}/.well-known" "${ACME_WEBROOT}/.well-known/acme-challenge"

# 证书 SAN 是否盖住 $DOMAINS：输出未覆盖的域名（空 = 全覆盖）
san_missing() {
  local d missing=""
  for d in $DOMAINS; do
    openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -text 2>/dev/null \
      | grep -A2 'Subject Alternative Name' | grep -q "DNS:${d}\b" || missing="${missing} ${d}"
  done
  printf '%s' "$missing"
}

# ── 第 1 步：判定证书现状（只读，不动配置）─────────────────────
# 为什么把判定提前到装配置之前：引导态只该出现在「证书还没就绪」的时候。
#   证书已就绪时先装引导态，等于白白经历一次中间态、再 reload 一次才到正式态，
#   既多一次配置抖动，也把「正式态还没装上」的窗口拉长。
#   证书缺失时才必须守硬顺序：先 :80 引导态（含 ACME 通道）→ 签证书 → 换正式态。
CERT_PRESENT=0
if [ -s "${CERT_DIR}/fullchain.pem" ] && [ -s "${CERT_DIR}/privkey.pem" ]; then
  CERT_PRESENT=1
  MISSING="$(san_missing)"
  if [ -n "$MISSING" ]; then
    warn "证书 SAN 未覆盖:${MISSING} —— 需要重新签发"
    CERT_PRESENT=0
  fi
fi

# ── 第 2 步：只在证书没就绪时装 :80 引导态 ────────────────────
if [ "$CERT_PRESENT" = 1 ]; then
  log "证书已就绪且 SAN 覆盖 $DOMAINS → 跳过引导态，直接装正式配置"
elif [ -n "$HTTP_ONLY_CONF" ] && [ -f "$HTTP_ONLY_CONF" ]; then
  install_conf "$HTTP_ONLY_CONF" "http-only"
else
  warn "证书未就绪且未提供 --http-only：假定现场 :80 已带 ACME 通道（否则签发会失败）"
fi

# ── 第 3 步：确保证书 ─────────────────────────────────────────
if [ "$CERT_PRESENT" = 1 ]; then
  # 顺手续期（幂等：未临期时 certbot 自己跳过）
  log "尝试续期（未临期则自动跳过）..."
  certbot renew --quiet --cert-name "$CERT_NAME" 2>&1 | sed 's/^/[apply-nginx]   /' || \
    warn "certbot renew 失败（不阻断，证书仍在有效期内；但请在到期前排查）"
else
  log "签发证书: $DOMAINS"
  DOMAIN_ARGS=""
  for d in $DOMAINS; do DOMAIN_ARGS="$DOMAIN_ARGS -d $d"; done
  # 这里用 --expand 而不是 --keep-until-expiring：
  #   走到这个分支有两种情况 —— 证书文件不存在，或证书存在但 SAN 没盖住 $DOMAINS。
  #   后一种若用 --keep-until-expiring，certbot 会因「证书未临期」直接跳过，
  #   于是 www 永远进不来，而配置照样装上去 —— 正是要防的假绿。
  #   --expand 明确表达「域集合需要变大」，由 certbot 决定是否重签。
  if ! certbot certonly --webroot -w "$ACME_WEBROOT" \
        --cert-name "$CERT_NAME" $DOMAIN_ARGS \
        --non-interactive --agree-tos --expand \
        ${EMAIL:+--email "$EMAIL"} --no-eff-email 2>&1 | sed 's/^/[apply-nginx]   /'; then
    warn "证书签发失败 —— 站点保持 :80 可用，但 HTTPS 未通过（本次部署判失败）"
    warn "排查：DNS 是否指向本机 / 80 是否可达 / ACME 通道是否被代理走"
    exit 1
  fi
fi

# ── 第 4 步：装正式态之前再核一次 SAN ─────────────────────────
# certbot 返回 0 不等于 SAN 就对了（历史证书 / 缓存 / --expand 没触发都可能骗人）。
# 覆盖不达标就绝不安装带 ssl_certificate 的配置 —— 装了就是浏览器报证书错。
STILL_MISSING="$(san_missing)"
if [ -n "$STILL_MISSING" ]; then
  die "证书 SAN 未覆盖:${STILL_MISSING} —— 拒绝安装 --full（装了就是 HTTPS 报证书错）"
fi
log "✅ 证书 SAN 覆盖: $DOMAINS"

# ── 第 5 步：换成正式配置（:80 301 + :443）────────────────────
install_conf "$FULL_CONF" "full"

# ── 第 4 步：443 必须真的在监听（配置对了但没 reload 成功 = 假绿）──
if ss -ltn 2>/dev/null | grep -qE ':443\b'; then
  log "✅ :443 正在监听"
else
  # ss 缺失时的退路：直连
  if curl -sk -o /dev/null --connect-timeout 3 https://127.0.0.1/ ; then
    log "✅ :443 可连接（ss 不可用，已用直连验证）"
  else
    die ":443 未监听 —— 配置已装但 TLS 没起来，本次部署判失败"
  fi
fi

log "完成：$DST"
