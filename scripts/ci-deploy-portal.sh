#!/usr/bin/env bash
# 从 GitHub 托管运行器登录新机，发布 szbolent.com 门户。
# 主机指纹只接受已经存好的 ECDSA P-256。对不上就退出。
# 拒绝阿里云书店和已退役的旧腾讯云橱窗。
set -euo pipefail

host="${DEPLOY_HOST:-}"
user="${DEPLOY_USER:-ubuntu}"
key_text="${DEPLOY_SSH_KEY:-}"
expected="${DEPLOY_HOST_FINGERPRINT:-}"

missing=()
[ -n "$host" ] || missing+=("DEPLOY_HOST")
[ -n "$key_text" ] || missing+=("DEPLOY_SSH_KEY")
[ -n "$expected" ] || missing+=("DEPLOY_HOST_FINGERPRINT")
if [ "${#missing[@]}" -gt 0 ]; then
  echo "missing env: ${missing[*]}" >&2
  exit 1
fi

case "$host" in
  47.115.168.107|47.115.*|1.14.202.161)
    echo "refusing retired or bookstore host" >&2
    exit 1
    ;;
  *[!A-Za-z0-9.:_-]*|-*)
    echo "invalid DEPLOY_HOST format" >&2
    exit 1
    ;;
esac

case "$user" in
  *[!A-Za-z0-9._-]*|-*|"")
    echo "invalid DEPLOY_USER format" >&2
    exit 1
    ;;
esac

root="$(cd "$(dirname "$0")/.." && pwd)"
test -s "$root/dist/index.html"
test -s "$root/deploy/nginx/szbolent.com.conf"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
printf '%s\n' "$key_text" > "$tmp/key"
chmod 600 "$tmp/key"

scanned=""
for _attempt in 1 2 3; do
  scanned=$(ssh-keyscan -t ecdsa -T 10 "$host" 2>/dev/null | grep -v '^#' || true)
  if [ -n "$scanned" ]; then
    break
  fi
  sleep 2
done
if [ -z "$scanned" ]; then
  echo "host key scan failed" >&2
  exit 1
fi

matched=""
while IFS= read -r line; do
  [ -n "$line" ] || continue
  fp=$(printf '%s\n' "$line" | ssh-keygen -lf - | awk 'NR==1 { print $2 }')
  if [ "$fp" = "$expected" ]; then
    matched="$line"
    break
  fi
done <<EOF
$scanned
EOF
if [ -z "$matched" ]; then
  echo "host key fingerprint mismatch" >&2
  exit 1
fi
printf '%s\n' "$matched" > "$tmp/known_hosts"

ssh_opts=(
  -i "$tmp/key"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o ConnectTimeout=30
  -o StrictHostKeyChecking=yes
  -o UserKnownHostsFile="$tmp/known_hosts"
  -o HostKeyAlgorithms=ecdsa-sha2-nistp256
  -o UpdateHostKeys=no
)
export RSYNC_RSH="ssh ${ssh_opts[*]}"

ssh "${ssh_opts[@]}" "${user}@${host}" "mkdir -p ~/szbolent-portal/incoming"
rsync -az --delete "$root/dist/" "${user}@${host}:~/szbolent-portal/incoming/dist/"
rsync -az \
  "$root/deploy/nginx/szbolent.com.conf" \
  "$root/scripts/publish-szbolent-com.sh" \
  "${user}@${host}:~/szbolent-portal/incoming/"
ssh "${ssh_opts[@]}" "${user}@${host}" "chmod 755 ~/szbolent-portal/incoming/publish-szbolent-com.sh && ~/szbolent-portal/incoming/publish-szbolent-com.sh"
