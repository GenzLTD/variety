#!/usr/bin/env bash
# 在阿里云 ECS 工作台终端直接执行（重置后首次部署）
# curl -fsSL https://raw.githubusercontent.com/szpeter2026/szbolent-portal/main/scripts/bootstrap-wp-on-server.sh | bash
# 或本地: bash scripts/bootstrap-wp-on-server.sh
set -euo pipefail

REMOTE_DIR="/opt/bolent-wp"
WP_HOME="${WP_HOME:-http://47.115.168.107}"

info() { echo "[bootstrap] $*"; }

info "1/6 安装依赖..."
dnf install -y nginx git curl openssl podman-docker
systemctl enable --now podman.socket 2>/dev/null || true
systemctl enable nginx
systemctl start nginx 2>/dev/null || true

if ! docker compose version &>/dev/null; then
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

info "2/6 拉取 Bolent 子主题..."
mkdir -p "$REMOTE_DIR/themes"
if [[ -d /tmp/szbolent-portal/design-system/phase3-wordpress/astra-child ]]; then
  rm -rf "$REMOTE_DIR/themes/bolent-astra-child"
  cp -r /tmp/szbolent-portal/design-system/phase3-wordpress/astra-child \
    "$REMOTE_DIR/themes/bolent-astra-child"
elif [[ ! -d "$REMOTE_DIR/themes/bolent-astra-child" ]]; then
  rm -rf /tmp/szbolent-portal
  if git clone --depth 1 https://github.com/szpeter2026/szbolent-portal.git /tmp/szbolent-portal 2>/dev/null; then
    cp -r /tmp/szbolent-portal/design-system/phase3-wordpress/astra-child \
      "$REMOTE_DIR/themes/bolent-astra-child"
  else
    echo "子主题未找到：请从本机 scp 上传到 $REMOTE_DIR/themes/bolent-astra-child"
    exit 1
  fi
fi

info "3/6 写入 Docker Compose..."
cat > "$REMOTE_DIR/docker-compose.wp.prod.yml" <<'YAML'
services:
  mysql:
    image: mysql:8.0
    container_name: bolent_wp_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-bolent_wp}
      MYSQL_USER: ${MYSQL_USER:-wordpress}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - bolent_wp_mysql_data:/var/lib/mysql
    networks:
      - bolent-wp-net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 8
      start_period: 40s

  wordpress:
    image: wordpress:6.7-php8.3-apache
    container_name: bolent_wp
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      WORDPRESS_DB_HOST: mysql:3306
      WORDPRESS_DB_USER: ${MYSQL_USER:-wordpress}
      WORDPRESS_DB_PASSWORD: ${MYSQL_PASSWORD}
      WORDPRESS_DB_NAME: ${MYSQL_DATABASE:-bolent_wp}
      WORDPRESS_TABLE_PREFIX: bolent_
      WORDPRESS_CONFIG_EXTRA: |
        define('WP_HOME','${WP_HOME}');
        define('WP_SITEURL','${WP_SITEURL}');
        define('DISALLOW_FILE_EDIT', true);
    volumes:
      - bolent_wp_data:/var/www/html
      - ./themes/bolent-astra-child:/var/www/html/wp-content/themes/bolent-astra-child:ro
    ports:
      - "127.0.0.1:8080:80"
    networks:
      - bolent-wp-net

volumes:
  bolent_wp_mysql_data:
  bolent_wp_data:

networks:
  bolent-wp-net:
    driver: bridge
YAML

info "4/6 生成 .env..."
cd "$REMOTE_DIR"
if [[ ! -f .env ]]; then
  MYSQL_ROOT_PW="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  MYSQL_PW="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  cat > .env <<EOF
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PW}
MYSQL_PASSWORD=${MYSQL_PW}
MYSQL_DATABASE=bolent_wp
MYSQL_USER=wordpress
WP_HOME=${WP_HOME}
WP_SITEURL=${WP_HOME}
EOF
  chmod 600 .env
fi

info "5/6 启动 WordPress..."
docker compose -f docker-compose.wp.prod.yml --env-file .env up -d

info "6/6 配置 Nginx..."
cat > /etc/nginx/conf.d/bolent-wp.conf <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    # szbolent.com.cn / www.szbolent.com.cn 已于 v0.5.0（2026-11-08）停用并从官网契约移除；
    # 这里也一并删掉，不要改写成 szbolent.com —— 官网由另一台机器（vars.DEPLOY_HOST）服务。
    server_name 47.115.168.107 szbolent.cn www.szbolent.cn bolent.cn www.bolent.cn;

    client_max_body_size 64m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # API 代理 → Looma Flask (api.genz.ltd)
    location /v1/ {
        proxy_pass http://api.genz.ltd/v1/;
        proxy_set_header Host api.genz.ltd;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 10s;
    }
}
NGINX

rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
nginx -t
systemctl restart nginx

echo ""
echo "============================================"
echo "  WordPress 部署完成"
echo "  前台: ${WP_HOME}"
echo "  安装: ${WP_HOME}/wp-admin/install.php"
echo "============================================"
echo ""
echo "下一步:"
echo "  1. 浏览器打开安装向导，创建管理员"
echo "  2. 外观 → 安装 Astra → 启用 Bolent Astra Child"
echo "  3. 插件 → Contact Form 7"
echo "  4. 设置 → 固定链接 → 文章名"
echo ""
