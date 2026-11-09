#!/usr/bin/env bash
# 在新机上切换 szbolent.com 的静态产物，并装上按域名匹配的 nginx。
# 不改 looma 的 default_server，不引用尚不存在的证书。
# 调用前，CI 已把下面三样放到 ~/szbolent-portal/incoming/：
#   dist/  szbolent.com.conf  （本脚本自己）
set -euo pipefail

IN="$HOME/szbolent-portal/incoming"
D=/var/www/szbolent.com/dist
N="${D}.new"
P="${D}.prev"
CONF_AVAIL=/etc/nginx/sites-available/szbolent.com.conf
CONF_LINK=/etc/nginx/sites-enabled/szbolent.com.conf

say() { echo "[szbolent.com] $*"; }

test -s "$IN/dist/index.html" || { echo "FATAL: incoming dist 没有 index.html" >&2; exit 1; }
test -s "$IN/szbolent.com.conf" || { echo "FATAL: 缺 szbolent.com.conf" >&2; exit 1; }
grep -q 'server_name szbolent.com www.szbolent.com' "$IN/szbolent.com.conf"
if grep -E '^[[:space:]]*listen .*default_server' "$IN/szbolent.com.conf" >/dev/null; then
  echo "FATAL: 门户配置不能抢 default_server" >&2
  exit 1
fi
if grep -E '^[[:space:]]*listen .*443' "$IN/szbolent.com.conf" >/dev/null; then
  echo "FATAL: 证书未到，拒绝装 443" >&2
  exit 1
fi

sudo mkdir -p /var/www/szbolent.com /var/www/certbot
sudo rm -rf "$N"
sudo mkdir -p "$N"
sudo cp -a "$IN/dist/." "$N/"
sudo chmod -R a+rX /var/www/szbolent.com "$N"

sudo rm -rf "$P"
if [ -d "$D" ]; then sudo mv "$D" "$P"; fi
sudo mv "$N" "$D"
test -s "$D/index.html"

rollback_dist() {
  if [ -d "$P" ]; then
    sudo rm -rf "$D"
    sudo mv "$P" "$D"
    say "dist 已回滚"
  fi
}

sudo cp "$IN/szbolent.com.conf" "$CONF_AVAIL"
sudo ln -sfn "$CONF_AVAIL" "$CONF_LINK"
if ! sudo nginx -t; then
  sudo rm -f "$CONF_LINK"
  sudo nginx -t
  sudo systemctl reload nginx
  rollback_dist
  echo "FATAL: nginx -t 失败，已撤回门户站点" >&2
  exit 1
fi
sudo systemctl reload nginx

portal=$(curl -sf -m 10 -H 'Host: szbolent.com' http://127.0.0.1/ || true)
printf '%s' "$portal" | grep -q 'id="app"' || {
  rollback_dist
  echo "FATAL: Host szbolent.com 不是门户 SPA" >&2
  exit 1
}
curl -sf -m 10 http://127.0.0.1/health | grep -q 'looma-backend' || {
  echo "FATAL: 默认站点不再是 looma 宿主" >&2
  exit 1
}
say "publish OK"
