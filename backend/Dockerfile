# ============================================================
# Page Engine（Rust + Axum，:5300）生产镜像
#
# 为什么在 CI 构建、而不是在生产机编译：
#   现场只有 2 核 / 3.5G 内存 / 无 swap，rustc 链接 sqlx+casbin 时极易 OOM；
#   CI runner 是原生 x86_64 且资源充足。构建后 docker save → scp → podman load，
#   与现场架构（Alibaba Cloud Linux 3 / x86_64）一致，无交叉编译。
#
# 运行时按「相对 CWD」加载三样东西，缺一不可：
#   page-engine-service  二进制（监听 127.0.0.1:5300，由 .env 的 SERVER_HOST/PORT 决定）
#   migrations/          sqlx 启动时自动迁移（001 建表 / 002 种子 / 003 扩展种子）
#   model.conf           Casbin RBAC 模型（策略行本身存在 MySQL 的 casbin_rule 表）
# ============================================================

FROM rust:1-slim-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc libc6-dev pkg-config \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /src

# 依赖层单独先编：只 COPY 清单 + 空壳 main，后续只改源码时可命中缓存，
# 否则每次改动都要重下/重编 ~300 个 crate。
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src && printf 'fn main() {}\n' > src/main.rs \
 && cargo build --release \
 && rm -rf src

COPY src ./src
COPY migrations ./migrations
COPY model.conf ./model.conf
# touch 保证真实 main.rs 一定重编（否则 cargo 会沿用上面那次空壳产物）
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates bash tzdata \
 && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Shanghai
WORKDIR /app
COPY --from=build /src/target/release/page-engine-service /app/page-engine-service
COPY --from=build /src/migrations /app/migrations
COPY --from=build /src/model.conf /app/model.conf
EXPOSE 5300
# 镜像里没有 curl/wget，用 bash 的 /dev/tcp 判端口可连（真实业务就绪由部署脚本用 HTTP 判）
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/5300'
ENTRYPOINT ["/app/page-engine-service"]
