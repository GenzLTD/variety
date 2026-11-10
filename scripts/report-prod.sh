#!/usr/bin/env bash
# =============================================
# szbolent-portal 生产回执脚本（不是验证脚本）
# 用法: bash scripts/report-prod.sh
# 在本地执行，对线上入口做只读体检并打印回执。
#
# 口径（L3）：结论依赖公网 + root SSH + 目标机当时的状态，换台机器或换个时间
# 跑就不是同一个结论，因此不能作为「仓的断言」。可在任意机器复现的断言请用:
#   bash scripts/verify-offline.sh
# 部署门禁用的硬断言（在目标机上跑）见:
#   scripts/verify-prod.sh
#
# 本脚本只读：不写文件、不改配置。口令一律不经过 argv（argv 在 /proc 里
# 同机可见），只从容器自身的环境变量里读，既是检查也顺带验证了
# 「容器内那份口令现在确实能用」。
# =============================================
# set -u（不开 -e / pipefail）：回执要「跑完所有项再汇总」，中途退出就失去意义；
# 且 check 里用 eval + 管道，pipefail 会因 grep -q 提前退出把 curl 收成 SIGPIPE
# 而误报 FAIL。假绿/假红都不可接受，这里选择不开。
set -u

SERVER="${VERIFY_SERVER:-root@47.115.168.107}"
SSH_TIMEOUT="${VERIFY_SSH_TIMEOUT:-8}"
# 入口域名与地址：默认按域名 + --resolve 打这个 IP，这样既不走本地 DNS
# （不受本机 hosts/DNS 影响），又能真实验证书链。
SITE_HOST="${VERIFY_HOST:-szbolent.com}"
SITE_IP="${VERIFY_IP:-47.115.168.107}"
CERT_MIN_DAYS="${VERIFY_CERT_MIN_DAYS:-20}"

# 计数必须用赋值，不可写成 ((PASS++))：
# 在 set -e 下，((PASS++)) 当 PASS=0 时算术表达式结果为 0 → 返回状态 1 → 脚本静默中止，
# 于是本回执永远打不出来（第一项检查后即退出）。已实证，勿改回。
PASS=0
FAIL=0
SKIP=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# 对入口发请求：强制解析到目标 IP，保留真实 Host/SNI
site() {
  curl -sS -m 20 \
    --resolve "${SITE_HOST}:443:${SITE_IP}" --resolve "www.${SITE_HOST}:443:${SITE_IP}" \
    --resolve "${SITE_HOST}:80:${SITE_IP}"  --resolve "www.${SITE_HOST}:80:${SITE_IP}" "$@"
}
ssh_do() {
  ssh -o ConnectTimeout="${SSH_TIMEOUT}" -o BatchMode=yes "${SERVER}" "$@" 2>/dev/null
}
# 取线上证书的 SAN 列表（每行一个域名，去掉 DNS: 前缀）。
# 用 grep -oE + -x 精确匹配，不用 \b —— BSD grep 不认 \b，会在 macOS 上误判。
cert_san() {
  echo | openssl s_client -connect "${SITE_IP}:443" -servername "${SITE_HOST}" 2>/dev/null \
    | openssl x509 -noout -text 2>/dev/null \
    | grep -A2 'Subject Alternative Name' \
    | grep -oE 'DNS:[A-Za-z0-9.*-]+' | sed 's/^DNS://'
}

# 用容器「自己环境变量里那份」根口令自测 MySQL，存活则打印 alive。
# 刻意不写 -p<pw>：那会把口令暴露在 argv（/proc 里同机任何用户都看得到），
# 也不去读宿主机 .env —— 那只能证明文件里有什么，证明不了能登录。
mysql_ping() {
  ssh_do "${RT:-podman} exec bolent_wp_mysql sh -c 'MYSQL_PWD=\$MYSQL_ROOT_PASSWORD mysqladmin ping -h localhost -uroot'"
}

# 打印 .env 里「仍在使用的、Actions Run #14 日志泄露过的那两个口令」的指纹。
# 无输出 = 干净。只比指纹不比明文：门禁能用，且口令不会再进仓库。
# 指纹常量说明见 scripts/verify-prod.sh 同名常量。
#
# 注意不能用 grep -v 来判「不含」：多行输入下 -v 只要有一行不匹配就成功，
# 而「有一个口令仍是泄露值」恰恰是必须判红的情况。
leaked_still_in_use() {
  ssh_do 'grep -hE "^MYSQL_ROOT_PASSWORD=|^MYSQL_PASSWORD=" /opt/szbolent-cn/.env /opt/bolent-wp/.env 2>/dev/null | cut -d= -f2- | while read -r v; do printf "%s" "$v" | sha256sum | cut -c1-16; done' \
    | grep -E '^(9da003569bee79ec|3946ee93c37201b3)$'
}

check() {
  local name="$1" cmd="$2"
  printf "  [%s] ... " "$name"
  if eval "$cmd" &>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ FAIL${NC}"
    FAIL=$((FAIL + 1))
  fi
}

# SSH 相关项的闸门：只有「SSH 可达」通过后才执行。
# 刻意不用「前面任何一项失败就跳过」——那会让「HTTPS 挂了想看服务器诊断」
# 这个最需要它的场景反而整段跳过（前端红 → 跳过后端 = 反了）。
SSH_OK=0
check_ssh() {
  local name="$1" cmd="$2"
  printf "  [%s] ... " "$name"
  if [ "$SSH_OK" != 1 ]; then
    echo -e "${YELLOW}⏭️  SKIP (SSH 不可达)${NC}"
    SKIP=$((SKIP + 1))
    return
  fi
  if eval "$cmd" &>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ FAIL${NC}"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "============================================"
echo "  szbolent-portal 生产回执"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  目标: ${SERVER}  入口: ${SITE_HOST} → ${SITE_IP}"
echo "============================================"
echo ""

# ─── 本地构建验证 ───
echo "--- 本地构建 ---"
check "npm 依赖完整" \
  'test -d node_modules && test -d node_modules/vue'

# 原写法为 'npx vue-tsc --noEmit 2>/dev/null || true' —— 恒真，本项永远 PASS（假绿）。
# 已去掉 || true：typecheck 真失败时本项必须 FAIL。
check "TypeScript 编译通过" \
  'test -d node_modules && npx vue-tsc --noEmit'

check "契约 → 入口配置同步" \
  'node scripts/gen-entry.mjs --check'

echo ""
echo "--- 门户入口 (HTTPS) ---"
check "首页 HTTPS 200" \
  'test "$(site -o /dev/null -w "%{http_code}" "https://${SITE_HOST}/")" = "200"'

check "首页含 Vue 挂载点（真的发布了门户）" \
  'site "https://${SITE_HOST}/" | grep -q "<div id=\"app\">"'

# 反向断言：Run #14 现场就是这个 —— HTTP 200 但内容是 WordPress 默认页
check "首页不是 WordPress 默认页" \
  '! site "https://${SITE_HOST}/" | grep -qiE "<title>Blog</title>|/wp-content/themes/twentytwenty"'

for p in /blog /about /services /contact; do
  check "深链接 ${p} 200（SPA 回退）" \
    "test \"\$(site -o /dev/null -w '%{http_code}' \"https://\${SITE_HOST}${p}\")\" = \"200\""
done

check "HTTP 301 到 HTTPS（裸域）" \
  "test \"\$(site -o /dev/null -w '%{http_code}' 'http://\${SITE_HOST}/')\" = \"301\""

check "HTTP 301 到 HTTPS（www）" \
  "test \"\$(site -o /dev/null -w '%{http_code}' 'http://www.\${SITE_HOST}/')\" = \"301\""

check "证书剩余有效期 ≥ ${CERT_MIN_DAYS} 天" \
  "echo | openssl s_client -connect ${SITE_IP}:443 -servername ${SITE_HOST} 2>/dev/null | openssl x509 -checkend $((CERT_MIN_DAYS * 86400)) -noout"

check "证书 SAN 覆盖 ${SITE_HOST}" \
  'cert_san | grep -qx "${SITE_HOST}"'

check "证书 SAN 覆盖 www.${SITE_HOST}" \
  'cert_san | grep -qx "www.${SITE_HOST}"'

# ACME 通道：请求一个不存在的 token，必须是 404 且不能是 SPA 首页。
# 若落进 location /（返回 index.html 200），certbot 的 webroot 校验就会静默失败。
check "ACME 校验通道未被 SPA 接管" \
  'test "$(site -o /dev/null -w "%{http_code}" "http://${SITE_HOST}/.well-known/acme-challenge/probe-does-not-exist")" = "404"'

echo ""
echo "--- WordPress 保留通道（HTTPS）---"
# WP 的 REST 索引里命名空间是 JSON 转义写法 `wp\/v2`（斜杠被转义），
# 直接 grep "wp/v2" 会把「接口正常」判成 FAIL（假阴性）。
# 先把反斜杠删掉再匹配，语义仍是「索引里真的有 wp/v2 命名空间」。
check "WP JSON 索引" \
  'site "https://${SITE_HOST}/wp-json/" | tr -d "\\\\" | grep -q "wp/v2"'

# 原先写的是 curl 到 /wp-json/wp/v2/posts 只 grep '[' —— 任何 JSON 数组都能过。
# 改成要求真的是文章集合（空站也是 []，但至少要是这个端点本身）。
check "文章 API 返回 JSON 数组" \
  'site "https://${SITE_HOST}/wp-json/wp/v2/posts" | grep -qE "^[[:space:]]*\["'

check "WP 后台可访问（跟随后仍在 https 本域）" \
  'site -L -o /dev/null -w "%{url_effective}" "https://${SITE_HOST}/wp-admin/" | grep -q "^https://${SITE_HOST}/"'

check "媒体通道 /wp-content 未被吞（非 5xx）" \
  'test "$(site -o /dev/null -w "%{http_code}" "https://${SITE_HOST}/wp-content/")" != "500"'

echo ""
echo "--- Looma / Page Engine 代理 ---"
check "Looma 代理非 502/504" \
  'site -o /dev/null -w "%{http_code}" "https://${SITE_HOST}/v1/menus?product=szbolent" | grep -qvE "^(502|504)$"'

# ─── 服务器侧（SSH）───────────────────────────────
echo ""
echo "--- 服务器基础状态 (SSH) ---"
printf "  [SSH 可达] ... "
if ssh_do 'echo ok' | grep -q ok; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS=$((PASS + 1))
  SSH_OK=1
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL=$((FAIL + 1))
fi

# 运行时探测：现场是 podman 起的容器，但也容忍 docker
RT="$(ssh_do 'if podman ps --format "{{.Names}}" 2>/dev/null | grep -qx bolent_wp; then echo podman; elif docker ps --format "{{.Names}}" 2>/dev/null | grep -qx bolent_wp; then echo docker; fi' || true)"
RT="${RT:-podman}"

check_ssh "nginx 配置语法正确" \
  "ssh_do 'nginx -t 2>&1' | grep -q 'syntax is ok'"

check_ssh "nginx 在跑且 :443 有监听" \
  "ssh_do 'ss -ltn | grep -qE \":443[[:space:]]\"'"

check_ssh "现役入口配置含 443 ssl" \
  "ssh_do 'grep -q \"listen 443 ssl\" /etc/nginx/conf.d/00-szbolent.conf'"

check_ssh "现役入口配置含 ACME 通道" \
  "ssh_do 'grep -q \"acme-challenge\" /etc/nginx/conf.d/00-szbolent.conf'"

check_ssh "现役入口配置 / 指向门户产物" \
  "ssh_do 'grep -q \"root /var/www/szbolent-portal/dist\" /etc/nginx/conf.d/00-szbolent.conf'"

check_ssh "certbot 续期定时器在跑" \
  "ssh_do 'systemctl is-active certbot-renew.timer' | grep -q active"

check_ssh "门户产物存在（index.html）" \
  "ssh_do 'test -s /var/www/szbolent-portal/dist/index.html'"

check_ssh "WordPress 容器 Up" \
  "ssh_do '${RT} ps --filter name=bolent_wp --format \"{{.Status}}\"' | grep -q Up"

check_ssh "MySQL 容器 Up" \
  "ssh_do '${RT} ps --filter name=bolent_wp_mysql --format \"{{.Status}}\"' | grep -q Up"

# 口令从容器自身环境变量读，不落 argv、不读宿主机 .env。
# 这一项同时验证了「容器内那份凭据现在确实能登录」。
check_ssh "MySQL 存活（容器内口令自测）" \
  'mysql_ping | grep -q alive'

# 数据卷真源：容器里的 /var/www/html/wp-content 必须来自一个非空卷。
# 挂错卷的症状是「站点变成全新安装」，而这一点在入口健康检查里完全看不出来。
check_ssh "WP 数据卷非空（挂的不是新卷）" \
  "ssh_do 'ls /var/lib/containers/storage/volumes/*bolent_wp_data/_data/wp-content 2>/dev/null || ls /var/lib/docker/volumes/*bolent_wp_data/_data/wp-content 2>/dev/null' | grep -q ."

echo ""
echo "--- 服务器资源 ---"
check_ssh "磁盘使用 < 80%" \
  "ssh_do 'df -h / | tail -1' | awk '{print \$5}' | grep -qvE '^(8[0-9]|9[0-9]|100)%'"

check_ssh "可用内存 > 256M" \
  "ssh_do 'free -m | grep Mem' | awk '{if (\$7 > 256) exit 0; else exit 1}'"

echo ""
echo "--- 凭据卫生 ---"
# .env 权限：同机任意用户可读即等于泄露（Actions 日志泄露过一次，别再叠一次）
check_ssh "/opt/szbolent-cn/.env 权限 ≤600" \
  "ssh_do 'stat -c \"%a\" /opt/szbolent-cn/.env' | grep -qE '^(600|400)$'"

# 已知泄露口令的 sha256 前缀（Actions Run #14 日志里明文出现过的那两个值）。
# 比对指纹而非明文：既不把口令再写进仓库，也能当回归门禁。
check_ssh ".env 不含 Run #14 泄露过的口令" \
  '! leaked_still_in_use | grep -q .'

echo ""
echo "============================================"
printf "  通过: ${GREEN}%d${NC}  |  失败: ${RED}%d${NC}  |  跳过: ${YELLOW}%d${NC}\n" $PASS $FAIL $SKIP
echo "============================================"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}⚠️  存在 ${FAIL} 项失败，请检查！${NC}"
  echo ""
  echo "常见解决方案："
  echo "  首页 200 但不是门户 → 门户产物没发上去: bash scripts/verify-prod.sh（在服务器上跑）"
  echo "  HTTPS 不通          → 大概率还在 TLS 引导态: ssh ${SERVER} 'bash /var/www/szbolent-portal/ops/apply-nginx.sh ...'"
  echo "  续期定时器不在跑     → 证书到期即全站挂: systemctl enable --now certbot-renew.timer"
  echo "  WP 变全新安装        → 挂到空卷了: ${RT} volume ls | grep bolent_wp_data，别用错目录/工程名跑 compose"
  echo "  Looma 502           → 检查上游 api-proxy (139.180.184.25) 与 looma (1.14.202.161) 连通性"
  echo "  磁盘满              → ssh ${SERVER} '${RT} system prune -a -f'（勿加 --volumes，会删数据卷）"
  echo "  SSH 失败            → 确认 key 已配置: ssh-copy-id ${SERVER}"
  exit 1
else
  echo -e "${GREEN}✅ 所有检查通过${NC}"
  exit 0
fi
