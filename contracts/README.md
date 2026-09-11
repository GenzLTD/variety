# 入口契约（entry contract）

**`entry.json` 是本仓入口分流的唯一真源。**

vite 开发代理、生产 nginx 配置、冒烟脚本全部由它驱动。此前散落的 `nginx.conf`、`scripts/nginx-wp-aliyun.conf`（内容重复）、`vite.config.ts` 里的手写 proxy 表——同一份规则写四遍、改一处漏三处，是生产事故的温床。

## 结构

| 字段 | 作用 |
|---|---|
| `dev` | 开发端口 / host |
| `upstreams` | 上游定义：`dev` / `prod` 目标、环境变量覆盖名、Host 头策略、`deployNote` |
| `routes` | 路径前缀 → 上游。nginx 前缀匹配最长者胜；`routes` 顺序同时用于 dev proxy 与冒烟，故保持 `/v1` 兜底在最后 |
| `sites` | 生产 nginx 站点：`portal`（门户入口）、`api`（Looma API 入口） |
| `sites.*.installPath` | 线上生效文件名，部署脚本据此安装 |
| `sites.*.reservedDomains` | **别人家的域名**。本仓站点一旦声明就会抢站，生成器直接拒绝 |

## 用法

```bash
# 生成 nginx 配置（产物：nginx.conf、nginx-api.genz.ltd.conf）
node scripts/gen-entry.mjs

# 校验产物是否与契约同步（CI 用，不同步则退出码 1）
node scripts/gen-entry.mjs --check

# 冒烟（读取契约，逐条验分流）
bash scripts/smoke.sh
```

## 约束

- 生成物首行标注 `GENERATED`，**不要手改**，改契约后重新生成。
- 新增后端分流：改 `routes` + `upstreams`，然后重跑生成器 + 冒烟。
- `routes` 里 `/v1` 是兜底项，Page Engine 的三条 `/v1/*` 必须排在它前面。
- **不得声明 `reservedDomains` 里的域名**（护栏会拦）。

## 线上真值（2026-09-12 阿里云实地勘察）

文档与实机不一致时以本表为准。来源：`nginx -T`、`ss -lntp`、`curl` 实测。

| 项 | 真值 |
|---|---|
| 生效配置 | `/etc/nginx/conf.d/00-szbolent.conf` + `szbolent-h5.conf` |
| `szbolent.com.cn` / `bolent.cn` / IP | → `127.0.0.1:8080`（WP 容器 `bolent_wp`，podman） |
| `szbolent.cn` | → 301 → `www.szbolent.cn` |
| `www.szbolent.cn` | → `/var/www/poetries-h5/dist`（★ 诗词 H5，**不属本仓**） |
| `/v1/` | → `http://14.29.216.219/v1/`（天翼，实测 **11ms**；`api.genz.ltd` 是同源海外实例，**1180ms**） |
| 门户产物 | `/var/www/szbolent-portal/dist` 完整存在，但**无任何 server 指向它** |
| 已装服务 | 仅 nginx / podman(WP+MySQL) / sshd；**无 Page Engine(5300)、无 Looma(5200)** |

> ⚠️ **上线前必读**：本契约把 `/v1/menus|pages|permissions` 指向 `127.0.0.1:5300`，而阿里云尚未部署 Page Engine——直接部署会让这三条 **502**。先把 PE 部署到同机，或改契约指向其实际位置。

## 站点切换（variant 机制）

`sites.portal.defaultLocation.mode` 控制生产 `location /` 的去向：

- `upstream` + `wordpress` → 现状：`szbolent.com.cn` 是 WP 内容站
- `static` + `staticRoot` → 门户 SPA 产物接管（`try_files ... /index.html`）

这是「一个契约、多变体」的落点：门户上线不改代码，只改契约一个字段再重生成。

切换前必须确认 WP 相关路径已显式分流（`/wp-json`、`/wp-login.php`、`/wp-admin`、`/wp-content`、`/wp-includes`）——否则门户接管 `location /` 后 WP 后台与图片会失联。这些条目已在 `routes` 中。
