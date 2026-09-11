#!/usr/bin/env bash
#
# deploy.sh — 构建并部署到 47.115.168.107
# 用法: ./scripts/deploy.sh
#
set -euo pipefail

SERVER="root@47.115.168.107"
REMOTE_DIR="/var/www/szbolent-portal"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[deploy]${NC} $*"; }
ok()    { echo -e "${GREEN}[deploy]${NC} $*"; }

echo ""
info "============================================"
info "  szbolent-portal 部署到 47.115.168.107"
info "============================================"
echo ""

# 1. 构建
info "1/4 构建生产包..."
npm run build
ok "构建完成: dist/"

# 2. 创建远程目录
info "2/4 创建远程目录..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR/dist $REMOTE_DIR/nginx"

# 3. 上传静态文件
info "3/4 上传静态文件..."
rsync -avz --delete dist/ "$SERVER:$REMOTE_DIR/dist/"

# 4. 上传并应用 Nginx 配置
info "4/4 更新 Nginx 配置..."
scp nginx.conf "$SERVER:$REMOTE_DIR/nginx/szbolent.conf"
ssh "$SERVER" bash -s <<'ENDSSH'
    set -e
    # 线上生效文件名是 00-szbolent.conf（00- 前缀抢先加载 → 门户占 default_server）。
    # 装成别的名字会与它重复声明 server_name（2026-09-12 实地勘察结论）。
    cp /var/www/szbolent-portal/nginx/szbolent.conf /etc/nginx/conf.d/00-szbolent.conf
    rm -f /etc/nginx/conf.d/default.conf

    # 清掉历史遗留的重名配置（若存在），否则 server_name 重复
    rm -f /etc/nginx/conf.d/szbolent.conf /etc/nginx/conf.d/bolent-wp.conf

    # 语法检查：conflicting server name 只是 warning，nginx -t 会放行，故显式拦截
    if ! nginx -t 2>&1 | tee /tmp/nginx-t.log; then
      echo "❌ nginx 配置语法错误，已中止"; exit 1
    fi
    if grep -q "conflicting server name" /tmp/nginx-t.log; then
      echo "❌ 检测到 server_name 冲突，已中止（另一份入口配置仍在 conf.d/）"
      grep "conflicting server name" /tmp/nginx-t.log
      exit 1
    fi

    systemctl reload nginx

    echo "Nginx 配置已更新并重载"
ENDSSH

echo ""
ok "============================================"
ok "  ✅ 部署完成!"
ok "  访问: http://47.115.168.107"
ok "============================================"
echo ""
