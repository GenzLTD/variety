#!/usr/bin/env bash
# =============================================================
# rotate-db-password.sh — 轮换生产库口令（本地执行，经 SSH 操作目标机）
#
# 背景：GitHub Actions 的部署日志（Run #14）里明文打印过一套 MYSQL_ROOT_PASSWORD /
#   MYSQL_PASSWORD —— 旧部署脚本用 podman-compose 起容器，而 podman-compose 会把
#   `podman run -e MYSQL_ROOT_PASSWORD=... -e MYSQL_PASSWORD=...` 整条命令回显到
#   stdout，于是口令进了公开日志。进过日志的口令一律视为已泄露，必须轮换。
#
# 本脚本做三件事：
#   1) 换掉现役库口令（root + 应用用户），新值写进 .env 并把权限收紧到 600
#   2) 清掉 /opt/bolent-wp/.env 里那套泄露值（历史遗留的另一套工程，非现役）
#   3) 重建容器并端到端验证；验证不过自动回滚（旧口令全程在内存里，回得去）
#
# 用法：
#   bash scripts/rotate-db-password.sh            # 预演：连通+预检，只读，打印将要做什么
#   bash scripts/rotate-db-password.sh --apply    # 真做（内容线中断约 20~40s）
#
# 设计约束（刻意的，改前先想清楚）：
#   - 口令不进 argv：argv 在 /proc 里同机任何用户都能看到（旧脚本还把它写进了日志）。
#     取旧口令只用「容器自己的环境变量 + sh -c」，ALTER 语句走 stdin。
#   - 不打印明文：只打印 sha256 前 16 位指纹，够核对、不可逆推。
#   - 新口令在目标机上生成（openssl rand），不经过本机、不进任何日志。
#   - 顺序固定：先改库 → 再改 .env → 再重建容器 → 再验证；失败回滚到旧口令。
#
# 退出码：0 成功（或预演通过）；1 失败（已回滚）；2 前置不满足（什么都没动）
# =============================================================
set -uo pipefail

SERVER="${VERIFY_SERVER:-root@47.115.168.107}"
SSH_TIMEOUT="${VERIFY_SSH_TIMEOUT:-10}"

MODE=dry-run
while [ "$#" -gt 0 ]; do
  arg="$1"
  shift
  case "$arg" in
    --apply) MODE=apply ;;
    -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
    *) printf '未知参数: %s（可用: --apply）\n' "$arg" >&2; exit 2 ;;
  esac
done

YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo "============================================"
echo "  生产库口令轮换  ($([ "$MODE" = apply ] && echo 'APPLY — 真执行' || echo 'DRY-RUN — 只读预演'))"
echo "  目标: ${SERVER}"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""
if [ "$MODE" = dry-run ]; then
  echo -e "${YELLOW}预演：只连上去做只读预检并打印计划，不改任何东西。${NC}"
else
  echo -e "${RED}APPLY：即将重建容器，内容线中断约 20~40s；验证失败会自动回滚。${NC}"
fi
echo ""

ssh -o ConnectTimeout="${SSH_TIMEOUT}" -o BatchMode=yes "${SERVER}" "bash -s -- ${MODE}" <<'REMOTE'
set -euo pipefail

MODE="$1"
LIVE_ENV="/opt/szbolent-cn/.env"
STALE_ENV="/opt/bolent-wp/.env"
TS="$(date +%Y%m%d%H%M%S)"

G() { printf '\033[0;32m%s\033[0m\n' "$*"; }
R() { printf '\033[0;31m%s\033[0m\n' "$*" >&2; }
Y() { printf '\033[0;33m%s\033[0m\n' "$*"; }
D() { printf '\033[2m%s\033[0m\n' "$*"; }
fp() { printf '%s' "$1" | sha256sum | cut -c1-16; }
die() { R "✗ $*"; exit 2; }

echo "── 1/5 运行时与容器 ─────────────────────────"
if command -v podman >/dev/null 2>&1 && podman ps --format '{{.Names}}' | grep -qx bolent_wp; then
  RT=podman
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -qx bolent_wp; then
  RT=docker
else
  die "找不到正在运行的 bolent_wp 容器（podman/docker 都不匹配），拒绝改动"
fi
G "✓ 运行时: $RT"

# 工程名与 compose 文件从运行中容器的标签里读 —— 唯一不会猜错的真源。
PRJ=$($RT inspect bolent_wp --format '{{index .Config.Labels "com.docker.compose.project"}}')
CFG=$($RT inspect bolent_wp --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}')
[ -n "${PRJ:-}" ] || die "容器上没有 compose 工程标签，拒绝猜工程名"
[ -n "${CFG:-}" ] || die "容器上没有 compose config_files 标签，拒绝猜 compose 文件"
G "✓ 工程: $PRJ"
G "✓ compose: $CFG"

echo "── 2/5 预检：数据卷非空 ──────────────────────"
VOL=$($RT volume ls --format '{{.Name}}' | grep -E 'bolent_wp_data$' | head -1)
[ -n "${VOL:-}" ] || die "找不到 WP 数据卷（*bolent_wp_data），拒绝改动"
MNT=$($RT volume inspect "$VOL" --format '{{.Mountpoint}}')
[ -d "$MNT/wp-content" ] || die "卷 $VOL 里没有 wp-content（疑似空卷），拒绝改动"
G "✓ 数据卷: $VOL ($(du -sh "$MNT" 2>/dev/null | cut -f1))"

[ -f "$LIVE_ENV" ] || die "找不到 $LIVE_ENV"
MODE_ENV=$(stat -c '%a' "$LIVE_ENV")
if printf '%s' "$MODE_ENV" | grep -qE '^(600|400)$'; then
  G "✓ $LIVE_ENV 权限 $MODE_ENV"
else
  Y "! $LIVE_ENV 权限为 $MODE_ENV（本次会收紧到 600：同机任意用户可读即等于泄露）"
fi

echo "── 3/5 现役口令指纹（只从容器环境变量取）────"
OLD_ROOT=$($RT exec bolent_wp_mysql printenv MYSQL_ROOT_PASSWORD)
WPUSER=$($RT exec bolent_wp printenv WORDPRESS_DB_USER)
OLD_WP=$($RT exec bolent_wp printenv WORDPRESS_DB_PASSWORD)
[ -n "$OLD_ROOT" ] || die "容器里读不到 MYSQL_ROOT_PASSWORD"
[ -n "$OLD_WP" ]   || die "容器里读不到 WORDPRESS_DB_PASSWORD"
[ -n "$WPUSER" ]   || die "容器里读不到 WORDPRESS_DB_USER"
echo "  root         指纹: $(fp "$OLD_ROOT")"
echo "  ${WPUSER}   指纹: $(fp "$OLD_WP")"

LEAKED_ROOT=9da003569bee79ec
LEAKED_WP=3946ee93c37201b3
if [ "$(fp "$OLD_ROOT")" = "$LEAKED_ROOT" ] || [ "$(fp "$OLD_WP")" = "$LEAKED_WP" ]; then
  Y "! 现役口令就是 Run #14 日志里泄露过的那套 —— 本次正是要换掉它"
else
  D "(现役口令不是日志里那套：本次属预防性轮换 + 清掉遗留目录里的泄露值)"
fi

# 库里实际存在的账号（决定 ALTER 哪几个）。
# ⚠️ 这里刻意不用 CONCAT(user,'@',host)：本行处在 sh -c '…' 的单引号里，
#    再嵌引号要三层转义，极易写成一个"看起来对但 MySQL 报语法错"的语句。
#    改成取两列、在 shell 里拼 —— 零引号、零转义。
USERS=$($RT exec -i bolent_wp_mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -uroot -N -B -e "SELECT user, host FROM mysql.user"' | awk '{print $1"@"$2}')
echo "  库内账号: $(printf '%s' "$USERS" | tr '\n' ' ')"
printf '%s' "$USERS" | grep -q "^root@localhost$" || Y "! 没有 root@localhost（有些镜像只有 root@%）"
printf '%s' "$USERS" | grep -q "^${WPUSER}@" || die "库里没有 ${WPUSER} 账号，拒绝继续（先查清应用用哪个账号）"
case "$CFG" in *,*) die "compose 标签里有多个配置文件（$CFG），本脚本只处理单文件，请手工处理" ;; esac

# .env 里必须真实存在要改的字段。这一步必须在 ALTER 之前做完：
# 否则会出现「库里口令已换、.env 没改」的半完成状态。
grep -qE '^MYSQL_ROOT_PASSWORD=' "$LIVE_ENV" \
  || die "$LIVE_ENV 里没有 MYSQL_ROOT_PASSWORD，拒绝继续（先确认现役 .env 的字段名）"
APPKEYS=$(grep -oE '^(MYSQL_PASSWORD|WORDPRESS_DB_PASSWORD)=' "$LIVE_ENV" | cut -d= -f1 | sort -u | tr '\n' ' ')
[ -n "${APPKEYS// /}" ] \
  || die "$LIVE_ENV 里既没有 MYSQL_PASSWORD 也没有 WORDPRESS_DB_PASSWORD，无法确定应用口令字段"
G "✓ .env 待改字段: MYSQL_ROOT_PASSWORD ${APPKEYS}"

echo "── 4/5 执行 ────────────────────────────────"
if [ "$MODE" != "apply" ]; then
  Y "预演结束，未做任何改动。将要执行："
  echo "  1) ALTER USER：换掉 root 与 ${WPUSER} 的口令（SQL 走 stdin，不进 argv）"
  echo "  2) $LIVE_ENV 写入新值并 chmod 600（先备份 $LIVE_ENV.bak.$TS）"
  echo "  3) 清掉 $STALE_ENV 里的泄露值（该文件存在才动）"
  echo "  4) 重建容器（工程 $PRJ / 文件 $CFG），验证不通过自动回滚"
  echo ""
  echo "  加 --apply 执行。"
  exit 0
fi

NEW_ROOT=$(openssl rand -hex 32)
NEW_WP=$(openssl rand -hex 32)

cp -p "$LIVE_ENV" "$LIVE_ENV.bak.$TS"
G "✓ 已备份 $LIVE_ENV.bak.$TS"

# 生成 ALTER 语句：口令通过 stdin 送进 mysql，绝不出现在 argv。
# 用旧 root 口令鉴权 —— 它此刻还在容器的环境变量里，取用不落盘、不进 ps。
alter_sql() {
  local newroot="$1" newwp="$2"
  for u in $(printf '%s' "$USERS" | grep '^root@'); do
    printf "ALTER USER '%s'@'%s' IDENTIFIED BY '%s';\n" "${u%@*}" "${u#*@}" "$newroot"
  done
  for u in $(printf '%s' "$USERS" | grep "^${WPUSER}@"); do
    printf "ALTER USER '%s'@'%s' IDENTIFIED BY '%s';\n" "${u%@*}" "${u#*@}" "$newwp"
  done
  printf 'FLUSH PRIVILEGES;\n'
}

if ! alter_sql "$NEW_ROOT" "$NEW_WP" \
     | $RT exec -i bolent_wp_mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -uroot'; then
  R "✗ ALTER USER 失败（库口令未改动）—— .env 未动，无需回滚"
  exit 1
fi
G "✓ 库口令已更换（root + ${WPUSER}）"

# .env：只改这几行，其余原样保留
sed -i "s|^MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=${NEW_ROOT}|" "$LIVE_ENV"
for k in $APPKEYS; do
  sed -i "s|^${k}=.*|${k}=${NEW_WP}|" "$LIVE_ENV"
done
chmod 600 "$LIVE_ENV"
# 断言写进去的就是新值（sed 没匹配到行时会静默什么都不做 —— 那就是"改了却没改"）
envval() { grep -E "^$1=" "$LIVE_ENV" | head -1 | cut -d= -f2-; }
ENVOK=1
[ "$(fp "$(envval MYSQL_ROOT_PASSWORD)")" = "$(fp "$NEW_ROOT")" ] \
  || { R "✗ $LIVE_ENV 的 MYSQL_ROOT_PASSWORD 未写入预期值（sed 没匹配到该行？）"; ENVOK=0; }
for k in $APPKEYS; do
  [ "$(fp "$(envval "$k")")" = "$(fp "$NEW_WP")" ] \
    || { R "✗ $LIVE_ENV 的 ${k} 未写入预期值"; ENVOK=0; }
done
if [ "$ENVOK" != 1 ]; then
  # 关键：不要在这里直接 exit。库口令此刻已经是新值，若就这么退出，
  # 会留下「库=新、.env=旧」的半完成状态，下次重建容器时 WordPress 直接连不上库。
  # 恢复 .env 备份后交给下面的验证/回滚流程收尾（验证必失败 → 自动把库改回旧值）。
  Y "! .env 写入不完整 → 已恢复备份，交给验证/回滚流程收尾，不让库与 .env 各说各话"
  cp -p "$LIVE_ENV.bak.$TS" "$LIVE_ENV"
else
  G "✓ $LIVE_ENV 已更新，权限 $(stat -c '%a' "$LIVE_ENV")"
fi

# 历史遗留目录 /opt/bolent-wp：不是现役工程，但里面的 .env 正是日志泄露值。
# 换掉（而不是删文件）：既消除泄露值被复用的可能，也不动别人的目录结构。
if [ -f "$STALE_ENV" ]; then
  cp -p "$STALE_ENV" "$STALE_ENV.bak.$TS"
  sed -i "s|^MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=$(openssl rand -hex 32)|" "$STALE_ENV"
  sed -i "s|^MYSQL_PASSWORD=.*|MYSQL_PASSWORD=$(openssl rand -hex 32)|" "$STALE_ENV"
  chmod 600 "$STALE_ENV"
  # 回头查一遍：sed 没匹配到行时会静默不做事，不查就会"宣称清掉了、其实还在"
  STALE_LEFT=0
  for k in MYSQL_ROOT_PASSWORD MYSQL_PASSWORD; do
    v=$(grep -E "^${k}=" "$STALE_ENV" | head -1 | cut -d= -f2-)
    [ -n "$v" ] || continue
    case "$(fp "$v")" in "$LEAKED_ROOT"|"$LEAKED_WP") STALE_LEFT=1 ;; esac
  done
  if [ "$STALE_LEFT" = 0 ]; then
    G "✓ 已清掉 $STALE_ENV 里的泄露值（备份 $STALE_ENV.bak.$TS）"
  else
    Y "! $STALE_ENV 里仍能匹配到泄露值指纹 —— 该目录的字段名可能不是 MYSQL_*，请手工核对"
  fi
else
  D "(无 $STALE_ENV，跳过)"
fi

echo "── 重建容器 ────────────────────────────────"
if $RT compose version >/dev/null 2>&1; then CMD="$RT compose"; else CMD=podman-compose; fi
# ⚠️ 必须过滤输出：podman-compose 会把 `podman run -e MYSQL_PASSWORD=<明文> ...`
# 整条回显出来 —— Run #14 的泄露就是这么发生的。这里把任何 KEY=值 里的值抹掉。
redact() { sed -E 's/([A-Za-z_]*PASSWORD|MYSQL_[A-Z_]*)=([^ ][^ ]*)/\1=***REDACTED***/g'; }
OUT=$($CMD -p "$PRJ" -f "$CFG" up -d --force-recreate 2>&1) || {
  Y "! --force-recreate 不受支持，改用「删容器再起」"
  $RT rm -f bolent_wp bolent_wp_mysql
  OUT=$($CMD -p "$PRJ" -f "$CFG" up -d 2>&1) || true
}
printf '%s\n' "$OUT" | redact | sed 's/^/  /'
sleep 15

echo "── 5/5 验证 ────────────────────────────────"
verify() {
  local ok=1
  for c in bolent_wp bolent_wp_mysql; do
    $RT ps --format '{{.Names}}' | grep -qx "$c" || { R "  ✗ 容器 $c 不在运行"; ok=0; }
  done
  # 最强的一条：容器自己 env 里的口令（= 重建后 .env 的新值）必须能登录。
  # 它通过了，说明「库里改的」「.env 里写的」「容器里生效的」三者一致。
  if $RT exec bolent_wp_mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysqladmin ping -h localhost -uroot' 2>/dev/null | grep -q alive; then
    G "  ✓ MySQL 用 .env 里的新口令自测通过（三者一致）"
  else
    R "  ✗ MySQL 用新口令自测失败（库/.env/容器 env 不一致）"; ok=0
  fi
  # 应用层：WordPress 拿不到库就出不了 /wp-json
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 http://127.0.0.1:8080/wp-json/ || true)
  if [ "$code" = "200" ]; then
    G "  ✓ WordPress 连库正常（/wp-json → 200）"
  else
    R "  ✗ WordPress /wp-json → ${code:-000}（应用用户口令或网络有问题）"; ok=0
  fi
  [ "$ok" = 1 ]
}

if verify; then
  G "✅ 轮换完成"
  echo ""
  echo "  新 root     口令指纹: $(fp "$NEW_ROOT")"
  echo "  新 ${WPUSER} 口令指纹: $(fp "$NEW_WP")"
  echo "  旧口令留在 $LIVE_ENV.bak.$TS —— 它就是历史泄露值所在文件，"
  echo "  建议先跑一次 scripts/report-prod.sh 复核，确认无误后再删除备份。"
  exit 0
fi

R "✗ 验证未通过 → 自动回滚到旧口令"
# 此刻 root 口令可能是新的（ALTER 成功）也可能是旧的（ALTER 没生效）。
# 注意：回滚这一段不得不把口令放进 podman 的 -e（= 宿主机 argv）——这是全脚本
# 唯一一处例外，原因是无法预知哪份有效；仅在本机 root 可见，且动作是「改回旧值」。
AUTH=""
for pw in "$NEW_ROOT" "$OLD_ROOT"; do
  if printf 'SELECT 1;\n' | $RT exec -i -e MYSQL_PWD="$pw" bolent_wp_mysql mysql -uroot -N >/dev/null 2>&1; then
    AUTH="$pw"; break
  fi
done
if [ -z "$AUTH" ]; then
  R "✗ 新旧口令都无法鉴权，无法自动回滚。请手工处理："
  echo "  1) cp -p $LIVE_ENV.bak.$TS $LIVE_ENV"
  echo "  2) $RT rm -f bolent_wp bolent_wp_mysql && $CMD -p $PRJ -f $CFG up -d"
  echo "  3) 若库口令已是新值，用新 root 口令（指纹 $(fp "$NEW_ROOT")）登入后改回；"
  echo "     明文在 $LIVE_ENV.bak.$TS 里没有，需从 ALTER 时的终端记录找回"
  exit 1
fi
if ! alter_sql "$OLD_ROOT" "$OLD_WP" | $RT exec -i -e MYSQL_PWD="$AUTH" bolent_wp_mysql mysql -uroot; then
  R "! 改回旧口令时出错，需人工介入"
fi
cp -p "$LIVE_ENV.bak.$TS" "$LIVE_ENV"
$RT rm -f bolent_wp bolent_wp_mysql
OUT=$($CMD -p "$PRJ" -f "$CFG" up -d 2>&1) || true
printf '%s\n' "$OUT" | redact | sed 's/^/  /'
sleep 12
if verify; then
  G "✓ 已回滚到旧口令，站点恢复原状（库/.env 都是旧值）"
else
  R "✗ 回滚后验证仍未通过，请人工介入（先看 podman logs bolent_wp / bolent_wp_mysql）"
fi
exit 1
REMOTE

STATUS=$?
echo ""
case "$STATUS" in
  0) echo -e "${YELLOW}下一步：bash scripts/report-prod.sh 复核「凭据卫生」两项；确认无误后再删 .env.bak.* 备份。${NC}" ;;
  1) echo -e "${RED}轮换失败（脚本已尝试自动回滚）。请先看上面的输出判断当前库口令是新值还是旧值，再决定下一步，勿直接重跑。${NC}" ;;
  *) echo -e "${RED}前置检查未通过，未做任何改动（退出码 ${STATUS}）。${NC}" ;;
esac
echo ""
exit "$STATUS"
