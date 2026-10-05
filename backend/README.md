# Page Engine Service

动态路由 + Page Schema + RBAC 权限引擎 — PlanetX 生态共享基础设施的后端实现。

## ⚠️ 当前状态：未部署 / 已冻结（2026-10-06）

- 本服务（:5300）**从未被任何部署流水线拉起**。门户 `deploy.yml` 只发前端 `dist`，
  因此线上 `/v1/menus` 恒 404，曾导致顶部导航只剩静态「书店」（2026-09-28 两次假绿的来源：
  CI 用「容器在不在 / curl 是否 200」验收，看不出导航空）。
- **菜单已烘焙进构建**：真源是本目录下的种子 SQL，经 `scripts/gen-menus.mjs`
  导出为 `src/menus/<product>.json`，前端不再调用 `/v1/menus`。
- 前端对 `/v1/pages`、`/v1/permissions` 目前**零消费者**（`PageRenderer.vue` 无路由引用，
  `can()` / `loadPermissions()` 无调用点），nginx 里保留这两条属未接线保留项。
- 结论：**不要为了「把 CI 补全」去部署本服务**。等真要复活（菜单编辑器 / 重新接线 Page Schema）
  时再单独立项，步骤见 `docs/PAGE_ENGINE_REVIVAL.md`（待补）。

## 技术栈

| 组件 | 技术 |
|------|------|
| HTTP 框架 | Axum 0.8 |
| 数据库 | MySQL (SQLx 0.8) |
| 权限引擎 | Casbin 2.x (自实现 MySQL Adapter) |
| 认证 | JWT (jsonwebtoken) |
| 运行时 | Tokio |

## 快速启动

### 1. 环境准备

```bash
cp .env.example .env
# 编辑 .env 中的数据库连接和 JWT 密钥
```

### 2. 数据库初始化

```bash
# 创建数据库（如果不存在）
mysql -u root -e "CREATE DATABASE IF NOT EXISTS looma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行迁移
mysql -u root looma < migrations/001_init.sql

# 导入种子数据
mysql -u root looma < migrations/002_seed.sql
```

### 3. 编译和运行

```bash
cargo run
# 服务启动在 http://127.0.0.1:5300
```

> **端口说明**：本服务默认 `:5300`，与 `api-contract.yaml` 声明的 `:5200` 不同。
> `:5200` 为 looma 主 API 端口，Page Engine 独立部署在 `:5300`。Nginx 代理时需注意区分。

### 4. 验证

```bash
chmod +x test-integration.sh
./test-integration.sh
```

## API 端点（9 个 HTTP 操作，7 组资源路由）

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/v1/menus?product=` | 可选 | 获取用户可见菜单树 |
| GET | `/v1/menus/admin?product=` | Bearer Token (admin) | 获取完整菜单树 |
| POST | `/v1/menus/admin` | Bearer Token (admin) | 创建菜单项 |
| GET | `/v1/pages/by-path?path=` | 可选 | 获取页面 Schema（过滤后） |
| GET | `/v1/pages?product=` | Bearer Token (admin) | 列出页面 |
| POST | `/v1/pages` | Bearer Token (admin) | 创建/更新页面 |
| DELETE | `/v1/pages/{id}` | Bearer Token (admin) | 删除页面 |
| POST | `/v1/permissions/check` | Bearer Token | 检查用户权限 |
| GET | `/v1/permissions/my` | Bearer Token | 获取当前用户权限列表 |

## 项目结构

```
backend/
├── Cargo.toml
├── model.conf                  # Casbin RBAC model
├── src/
│   ├── main.rs                 # 服务入口
│   ├── config.rs               # 环境配置
│   ├── error.rs                # 错误类型
│   ├── db/
│   │   ├── mod.rs              # 连接池 + 迁移
│   │   └── models.rs           # 数据模型 + API 响应类型
│   ├── auth/
│   │   ├── mod.rs
│   │   ├── jwt.rs              # JWT 认证中间件
│   │   └── casbin_ext.rs       # Casbin RBAC 封装
│   ├── handlers/
│   │   ├── mod.rs              # 路由 + AppState
│   │   ├── menus.rs            # 菜单 API
│   │   ├── pages.rs            # 页面 Schema API
│   │   └── permissions.rs      # 权限 API
│   └── services/
│       ├── mod.rs
│       ├── menu_service.rs     # 菜单树构建 + 权限过滤
│       ├── page_service.rs     # 页面 Schema CRUD + 组件过滤
│       └── permission_service.rs # Casbin 策略管理
├── migrations/
│   ├── 001_init.sql            # 建表
│   └── 002_seed.sql            # 种子数据
└── test-integration.sh         # 集成测试
```

## 权限模型

使用 Casbin RBAC 模型：

```
[matchers]
m = g(r.sub, p.sub) && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)
```

### 预置角色

| 角色 | 继承 | 可见内容 |
|------|------|---------|
| `visitor` | - | 公开页面 |
| `authenticated` | - | 登录后可见 |
| `subscriber` | authenticated | 订阅者专区 |
| `friend` | subscriber | 好友可见 |
| `employer` | authenticated | 雇主视图 |
| `vc_verified` | authenticated | VC 认证内容 |
| `admin` | employer | 全部权限 |

### 组件可见性

Page Schema 中每个组件可设置 `visibleTo`：

```json
{
    "id": "contact-01",
    "type": "Contact", 
    "visibleTo": "employer",
    "props": {...}
}
```

- `public` — 所有人可见
- `authenticated` — 登录用户可见
- `employer` / `admin` / `subscriber` — 特定角色可见
