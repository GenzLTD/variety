#!/usr/bin/env bash
#
# deploy-wp-aliyun.sh — 部署 Bolent WordPress 到阿里云 ECS
# 用法: ./scripts/deploy-wp-aliyun.sh
#
set -euo pipefail

SERVER="root@47.115.168.107"
REMOTE_DIR="/opt/bolent-wp"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[wp-deploy]${NC} $*"; }
ok()    { echo -e "${GREEN}[wp-deploy]${NC} $*"; }

echo ""
info "============================================"
info "  Bolent WordPress → 阿里云 $SERVER"
info "============================================"
echo ""

# 1. 上传 compose、主题、nginx
info "1/5 上传文件..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR/themes $REMOTE_DIR/nginx"
rsync -avz "$PROJECT_ROOT/docker-compose.wp.prod.yml" "$SERVER:$REMOTE_DIR/"
rsync -avz "$PROJECT_ROOT/design-system/phase3-wordpress/astra-child/" \
  "$SERVER:$REMOTE_DIR/themes/bolent-astra-child/"
# 入口配置由契约生成（contracts/entry.json → nginx.conf），此处仅留档供比对；
# 实际安装由 scripts/deploy.sh 负责，不落 conf.d（避免与 00-szbolent.conf 重复 server_name）
node "$PROJECT_ROOT/scripts/gen-entry.mjs" >/dev/null
rsync -avz "$PROJECT_ROOT/nginx.conf" "$SERVER:$REMOTE_DIR/nginx/portal-entry.conf.reference"

# 2. 服务器初始化（仅首次）
info "2/5 安装 Docker + Nginx..."
ssh "$SERVER" bash -s <<'ENDSSH'
set -euo pipefail

if ! command -v docker &>/dev/null; then
  dnf install -y docker nginx curl
  systemctl enable --now docker
  # Docker Compose plugin
  mkdir -p /usr/local/lib/docker/cli-plugins
  COMPOSE_VER="v2.32.4"
  curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VER}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  docker compose version
fi

systemctl enable nginx
ENDSSH

# 3. 生成 .env（若不存在）
info "3/5 配置环境变量..."
ssh "$SERVER" bash -s <<'ENDSSH'
set -euo pipefail
cd /opt/bolent-wp
if [[ ! -f .env ]]; then
  MYSQL_ROOT_PW="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  MYSQL_PW="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  cat > .env <<EOF
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PW}
MYSQL_PASSWORD=${MYSQL_PW}
MYSQL_DATABASE=bolent_wp
MYSQL_USER=wordpress
WP_HOME=http://47.115.168.107
WP_SITEURL=http://47.115.168.107
EOF
  chmod 600 .env
  echo "已生成 /opt/bolent-wp/.env"
else
  echo ".env 已存在，跳过"
fi
ENDSSH

# 4. 启动 WordPress
info "4/5 启动 Docker 容器..."
ssh "$SERVER" bash -s <<'ENDSSH'
set -euo pipefail
cd /opt/bolent-wp
docker compose -f docker-compose.wp.prod.yml --env-file .env up -d
docker compose -f docker-compose.wp.prod.yml ps
ENDSSH

# 5. Nginx
# 入口配置（conf.d/00-szbolent.conf）由 scripts/deploy.sh 统一管理，且已包含 WP 分流
# （location / → 127.0.0.1:8080）。本脚本不再安装第二份 —— 2026-09-12 勘察：旧的
# bolent-wp.conf 与 00-szbolent.conf 声明了重叠的 server_name，已在线上被手工停用为 .bak。
info "5/5 校验 Nginx（入口配置归 deploy.sh 管理）..."
ssh "$SERVER" bash -s <<'ENDSSH'
set -euo pipefail
rm -f /etc/nginx/conf.d/bolent-wp.conf
nginx -t
systemctl reload nginx
ENDSSH

echo ""
ok "============================================"
ok "  ✅ WordPress 已部署"
ok "  前台: http://47.115.168.107"
ok "  安装: http://47.115.168.107/wp-admin/install.php"
ok "============================================"
echo ""
info "下一步（浏览器操作）："
info "  1. 打开安装向导，创建管理员账号"
info "  2. 外观 → 安装 Astra 父主题 → 启用 Bolent Astra Child"
info "  3. 插件 → 安装 Contact Form 7"
info "  4. 设置 → 固定链接 → 文章名"
echo ""
