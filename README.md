# Variety

> **一份入口契约，多端多变体。** szbolent.com 门户是它的第一个 variant。

自 `szbolent-portal@74ccc9b`（分支 `cursor/ascend-isv-certification`）迁出。旧仓不再演进，本仓是门户与多端组合层的**唯一开发树**。

## 持有与边界

Variety 持有**入口层**的四件事，且只持有这四件：

| 持有 | 位置 |
|---|---|
| 入口契约（分流唯一真源） | `contracts/entry.json` |
| 路由编排 | `src/composables/useDynamicRouter.ts`（菜单由 Page Engine 驱动） |
| 后端访问 | `src/api/` |
| 启停与冒烟 | `docker-compose.yml` · `scripts/smoke.sh` |

**不持有**：诗词 / 认证 / 支付不进本仓；页面文案真源归 Page Engine；不做第二个 CMS、不做第二套后台。

## 拓扑

```
Portal (Vue3 + Vite · :3000)
  ├── /v1/menus|pages|permissions → Page Engine :5300   （菜单 / 页面 Schema / RBAC）
  ├── /v1/*（兜底）                → Looma        :5200   （诗词 / RAG / 认证 / 支付）
  └── /wp-json                    → WordPress     :8800   （博客 CMS）
```

这不是文档描述，而是 `contracts/entry.json` 的内容——开发代理、生产 nginx、冒烟脚本**全部由它生成**。

## 快速开始

```bash
npm install

# 内容侧 + 门户（需先启动 Docker Desktop）
docker compose up -d

# Page Engine（宿主运行，依赖 3306 的 looma 库 —— 本机没有该库时先出 DB 回执，见下）
cd backend && cargo run

# 冒烟：检查项从契约生成，分流规则改了自己会跟着改
bash scripts/smoke.sh
```

## 验证与回执（勿混两类）

| 类型 | 命令 | 结论性质 |
|---|---|---|
| **断言** | `npm run verify:offline` | 与机器无关：L1 契约→产物同步 + L2 类型/构建。成员 `npm ci` 后可复现；退 1 = 仓的问题，退 2 = 环境不足 |
| 回执 | `npm run report:prod` | 打公网 + SSH 到生产机，结论随时点与网络而变 |
| 回执 | `npm run report:db-env` | 打本机 DB 环境（MySQL / PostgreSQL / pgvector），只读、不打印口令 |

DB 环境是典型的「结论随机器而变」：维护者本机没有的东西，成员可能有，反之亦然。
所以 pgvector / MySQL 的可用性**不由某一台机器断言**，而是各成员跑 `report:db-env` 回传后汇总。
口径、四态解读与回传模板见 [docs/DB_ENV_PROBE.md](./docs/DB_ENV_PROBE.md)。

## 契约：改一处，三处生效

```bash
# 1. 改分流规则 → contracts/entry.json
# 2. 重新生成 nginx（门户入口 + api.genz.ltd 入口）
node scripts/gen-entry.mjs
# 3. 校验产物与契约是否同步（CI 可挂）
node scripts/gen-entry.mjs --check
```

详见 [contracts/README.md](./contracts/README.md)。

生产 `location /` 的去向是契约里的一个字段——这是「多变体」的落点：

```jsonc
"sites": { "portal": { "defaultLocation": { "mode": "upstream" /* → static 则门户接管 */ } } }
```

## 迁出后修正的两处「没接线」

| # | 缺陷 | 状态 |
|---|---|---|
| 1 | 生产 `/v1/` 整段回源 Looma，**Page Engine 的三条分流在生产根本不存在**（本地 vite 有、云端没有）——即 `ARCHITECTURE_DECISION_MEMO` D4 所述"云上若仍整段 /v1 回源错误后端，仿真必挂" | **已修**：契约生成全量分流，`/v1/menus\|pages\|permissions` → `:5300` |
| 2 | `deploy.sh` 把门户产物上传到 `/var/www/szbolent-portal/dist`，但 `nginx.conf` 的 `location /` 指向 WP `:8080`，**产物从未被 serve** | **已纳入契约**（`defaultLocation` 显式声明）；实际切换（`mode: static`）待门户上线决策 |

## 待收敛（下一刀）

- `deploy.sh`（门户 → `/etc/nginx/conf.d/szbolent.conf`）与 `deploy-wp-aliyun.sh`（WP → `bolent-wp.conf`）装的是 **server_name 相同的两份配置**，后跑的覆盖前者。两条链路需二选一或合并。
- `docs/` 内多处路径仍指向旧树，需批量校正。
- `backend/`（Page Engine）本就是多产品底座（`product` 参数 + `restartRouter` 式切换），契约的 variant 机制应与它对齐。

## 文档（路线宪法）

`docs/` 内 21 份为迁出时继承的共识文档，重点：

| 文件 | 说明 |
|------|------|
| [ARCHITECTURE_DECISION_MEMO](./docs/ARCHITECTURE_DECISION_MEMO.md) | 架构决策 D1–D6 与验收口径 |
| [COMPOSABLE_PORTAL_LEARNING](./docs/COMPOSABLE_PORTAL_LEARNING.md) | Composable 门户对标清单 |
| [SITE_POSITIONING_MEMO](./docs/SITE_POSITIONING_MEMO.md) | 建站定位 |
| [OPERATIONS_MANUAL](./docs/OPERATIONS_MANUAL.md) | 运维手册（命令已以本仓为准，路径待校正） |
| [LINEAGE](./docs/LINEAGE.md) | 溯源与边界 |

## License

MIT
