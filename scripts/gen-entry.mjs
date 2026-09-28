#!/usr/bin/env node
/**
 * gen-entry.mjs — 从 contracts/entry.json 生成入口配置
 *
 * 产物：
 *   nginx.conf               门户入口（deploy.sh 使用，路径保持不变）
 *   nginx-api.genz.ltd.conf  api.genz.ltd → Looma
 *
 * 用法：
 *   node scripts/gen-entry.mjs           生成
 *   node scripts/gen-entry.mjs --check   仅校验是否与契约同步（CI）
 *   node scripts/gen-entry.mjs --http-only
 *                                        只输出门户的「TLS 引导态」配置到 stdout：
 *                                        仍是 :80 正常服务（不跳转），但已带上
 *                                        /.well-known/acme-challenge/ 通道。
 *                                        用于「证书还没签发」时先把 :80 装上去，
 *                                        否则带 ssl_certificate 的配置会因证书缺失
 *                                        导致 nginx -t 失败、整机 nginx 起不来。
 *
 * 零依赖，只用 node 内置模块。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTRACT_PATH = join(ROOT, 'contracts/entry.json')
const CHECK = process.argv.includes('--check')
// TLS 引导态：只出 :80（含 ACME 通道、不跳转）。见文件头说明。
const HTTP_ONLY = process.argv.includes('--http-only')

const contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'))

/** 契约自检：拦截会静默出错的配置 */
function validate(c) {
  const errs = []
  if (!c.upstreams || !c.routes) errs.push('缺少 upstreams 或 routes')

  for (const r of c.routes) {
    if (!r.prefix) errs.push('route 缺少 prefix')
    if (!c.upstreams[r.upstream]) {
      errs.push(`route ${r.prefix} 指向未定义的上游: ${r.upstream}`)
    }
  }

  // 兜底前缀 /v1 必须排在所有 /v1/xxx 之后，否则会吞掉 Page Engine 分流
  const v1BareIdx = c.routes.findIndex((r) => r.prefix === '/v1')
  if (v1BareIdx !== -1) {
    const before = c.routes.slice(0, v1BareIdx).filter((r) => r.prefix.startsWith('/v1/'))
    if (before.length === 0) {
      errs.push('/v1 兜底项之前没有 /v1/* 细分项，Page Engine 分流会被吞掉')
    }
    const after = c.routes.slice(v1BareIdx + 1).filter((r) => r.prefix.startsWith('/v1/'))
    if (after.length > 0) {
      errs.push(`/v1/* 细分项必须排在 /v1 之前，见: ${after.map((r) => r.prefix).join(', ')}`)
    }
  }

  for (const [name, up] of Object.entries(c.upstreams || {})) {
    if (!up.prod) errs.push(`上游 ${name} 缺少 prod 目标`)
  }

  // 门户落点与 TLS。契约里没有的概念不可能出现在产物里 —— Run #14 的
  // 「HTTPS 缺失 / 门户没上」正是「契约当年只有 listen:80 + upstream」的直接后果，
  // 所以这两块必须在这里拦住，而不是靠人记得。
  const portal = (c.sites || {}).portal
  if (!portal) {
    errs.push('缺少 sites.portal')
  } else {
    const dl = portal.defaultLocation
    if (!dl) {
      errs.push('sites.portal 缺少 defaultLocation（location / 的去向）')
    } else if (dl.mode === 'static') {
      if (!dl.staticRoot) errs.push('defaultLocation.mode=static 必须给出 staticRoot')
    } else if (dl.mode === 'upstream') {
      if (!c.upstreams[dl.upstream]) errs.push(`defaultLocation.upstream 未定义: ${dl.upstream}`)
    } else {
      errs.push(`defaultLocation.mode 非法: ${dl.mode}（只支持 static / upstream）`)
    }

    const tls = portal.tls
    if (tls && tls.enabled) {
      if (!tls.certDir) errs.push('tls.enabled 必须给出 certDir')
      if (!tls.acmeWebroot) errs.push('tls.enabled 必须给出 acmeWebroot（HTTP-01 续期通道的 webroot）')
      if (!Array.isArray(tls.serverNames) || tls.serverNames.length === 0) {
        errs.push('tls.enabled 必须给出 serverNames（须与证书 SAN 一致，且 A 记录指向本机）')
      }
    }
  }

  return errs
}

const problems = validate(contract)
if (problems.length) {
  console.error('[gen-entry] 契约不合法：')
  problems.forEach((p) => console.error('  - ' + p))
  process.exit(1)
}

function header(file, purpose) {
  return `# ${'='.repeat(60)}
# ⚠️  本文件由 scripts/gen-entry.mjs 从 contracts/entry.json 生成，请勿手改。
#     修改分流规则：改 contracts/entry.json → node scripts/gen-entry.mjs
#
#     ${purpose}
#     契约版本: v${contract.version}
# ${'='.repeat(60)}
`
}

function proxyHeaders(upstreamName) {
  const host = contract.upstreams[upstreamName].proxyHostHeader || '$host'
  return [
    `        proxy_set_header Host ${host};`,
    '        proxy_set_header X-Real-IP $remote_addr;',
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    '        proxy_set_header X-Forwarded-Proto $scheme;',
    '        proxy_connect_timeout 10s;',
    '        proxy_read_timeout 60s;',
    '        proxy_send_timeout 10s;',
  ].join('\n')
}

/** gzip 指令块（HTTP / HTTPS 两个 server 共用） */
function gzipLines() {
  return [
    '    gzip on;',
    '    gzip_vary on;',
    '    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;',
    '    gzip_min_length 256;',
  ]
}

/**
 * ACME (HTTP-01) 校验通道。
 * 这是「证书能续下去」的唯一命门：门户口径下 location / 要么被 SPA 接管、
 * 要么整体 301 到 https，若不单独放行 /.well-known/acme-challenge/，
 * certbot 的 webroot 校验必然失败 —— 而且是静默失败，直到证书到期当天全站 HTTPS 挂掉。
 */
function acmeLines(tls) {
  return [
    '',
    '    # Let\'s Encrypt HTTP-01 校验通道 —— certbot 续期依赖它，勿删。',
    `    # 域名: ${tls.serverNames.join(' ')}    webroot: ${tls.acmeWebroot}`,
    '    location /.well-known/acme-challenge/ {',
    `        root ${tls.acmeWebroot};`,
    '        default_type "text/plain";',
    '        allow all;',
    '    }',
  ]
}

/** 门户的全部 location（默认位置 + 契约声明的分流），不含 server 包装 */
function renderLocations(site) {
  const out = []

  // location / — 门户 / 内容站切换点
  const dl = site.defaultLocation
  out.push('    # ── 默认位置：门户 SPA 与 WP 内容站的切换点（见 contracts/README.md）──')
  out.push('    location / {')
  if (dl.mode === 'static') {
    out.push(`        root ${dl.staticRoot};`)
    out.push('        try_files $uri $uri/ /index.html;')
  } else {
    const target = contract.upstreams[dl.upstream].prod
    out.push(`        proxy_pass ${target};`)
    out.push('        proxy_set_header Host $host;')
    out.push('        proxy_set_header X-Real-IP $remote_addr;')
    out.push('        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;')
    out.push('        proxy_set_header X-Forwarded-Proto $scheme;')
    out.push('        proxy_read_timeout 120s;')
  }
  out.push('    }')

  // 契约声明的全部分流（nginx 前缀匹配：最长者胜，故无需人工排序）
  for (const route of contract.routes) {
    const up = contract.upstreams[route.upstream]
    out.push('')
    out.push(`    # ${route.desc} → ${route.upstream}`)
    out.push(`    location ${route.prefix} {`)
    out.push(`        proxy_pass ${up.prod};`)
    out.push(proxyHeaders(route.upstream))
    out.push('    }')
  }

  return out
}

/** 生成门户入口（含契约里的全部分流 + TLS） */
function renderPortal(site) {
  const tls = site.tls && site.tls.enabled ? site.tls : null
  const httpOnly = !tls || HTTP_ONLY
  const out = [header(site.file, site.desc), '']

  // ── :80 ──────────────────────────────────────────────────
  if (tls && !httpOnly) {
    out.push('# ── :80 —— 只做两件事：放行 ACME 校验、其余全部 301 到 HTTPS ──')
  } else if (tls) {
    out.push('# ── :80 —— TLS 引导态（gen-entry --http-only）：证书就绪前先以 HTTP 正常服务，')
    out.push('#        避免带 ssl_certificate 的配置在证书缺失时让 nginx -t 失败。──')
  } else {
    out.push('# ── :80 —— HTTP 入口（契约未开启 tls）──')
  }

  out.push('server {')
  out.push(`    listen ${site.listen}${site.defaultServer ? ' default_server' : ''};`)
  if (site.listen === 80) out.push('    listen [::]:80;')
  out.push(`    server_name ${site.serverNames.join(' ')};`)
  out.push('')
  out.push(`    client_max_body_size ${site.clientMaxBodySize || '64m'};`)
  out.push('    charset utf-8;')

  if (httpOnly && site.gzip) {
    out.push('')
    out.push(...gzipLines())
  }

  if (tls) out.push(...acmeLines(tls))

  if (tls && !httpOnly) {
    out.push('')
    out.push('    # ACME 通道已在上方放行；其余请求一律升级到 HTTPS。')
    out.push('    # 注意用 $host 而非固定域名：这样 www / 裸域各自升级后仍落在同一张证书的 SAN 内。')
    out.push('    location / {')
    out.push('        return 301 https://$host$request_uri;')
    out.push('    }')
  } else {
    out.push('')
    out.push(...renderLocations(site))
  }

  out.push('}')

  // ── :443 ─────────────────────────────────────────────────
  if (tls && !httpOnly) {
    out.push('')
    out.push('# ── :443 —— 门户正式入口。证书由 certbot 签发/续期，本文件只引用路径 ──')
    out.push('server {')
    out.push('    listen 443 ssl;')
    out.push('    listen [::]:443 ssl;')
    // 本机 nginx 1.24 不支持 `http2 on;`（需 ≥1.25.1），故不加 http2 指令：
    // 老语法 `listen 443 ssl http2` 在 1.25+ 又已废弃，两边都不写才不会被某次
    // nginx 升级卡住。要开 h2 时按版本二选一，别在契约里猜。
    out.push(`    server_name ${tls.serverNames.join(' ')};`)
    out.push('')
    out.push(`    ssl_certificate     ${tls.certDir}/fullchain.pem;`)
    out.push(`    ssl_certificate_key ${tls.certDir}/privkey.pem;`)
    out.push('    ssl_protocols TLSv1.2 TLSv1.3;')
    out.push('    ssl_prefer_server_ciphers off;')
    out.push('    ssl_session_cache shared:SSL:10m;')
    out.push('    ssl_session_timeout 10m;')
    if (tls.hsts) {
      out.push('    add_header Strict-Transport-Security "max-age=31536000" always;')
    }
    out.push('')
    out.push(`    client_max_body_size ${site.clientMaxBodySize || '64m'};`)
    out.push('    charset utf-8;')
    if (site.gzip) {
      out.push('')
      out.push(...gzipLines())
    }
    out.push('')
    out.push(...renderLocations(site))
    out.push('}')
  }

  return out.join('\n') + '\n'
}

/** 生成 API 入口（全部流量 → 指定上游） */
function renderApi(site) {
  const up = contract.upstreams[site.allToUpstream]
  const out = [header(site.file, site.desc), '']
  out.push('server {')
  out.push(`    listen ${site.listen};`)
  out.push(`    server_name ${site.serverNames.join(' ')};`)
  out.push('')
  out.push(`    location / {`)
  out.push(`        proxy_pass ${up.prod};`)
  out.push(proxyHeaders(site.allToUpstream))
  out.push('    }')
  out.push('}')
  return out.join('\n') + '\n'
}

const RENDERERS = { portal: renderPortal, api: renderApi }
const artifacts = []

// TLS 引导态：只往 stdout 吐门户的 :80 版（需要它先于证书落地）。
if (HTTP_ONLY) {
  process.stdout.write(renderPortal(contract.sites.portal))
  process.exit(0)
}

for (const [key, site] of Object.entries(contract.sites || {})) {
  const render = RENDERERS[key]
  if (!render) {
    console.error(`[gen-entry] 未知站点类型: ${key}`)
    process.exit(1)
  }
  artifacts.push({ path: join(ROOT, site.file), content: render(site), desc: site.desc })
}

// ── 输出 / 校验 ──────────────────────────────────────────────
let drifted = 0
for (const a of artifacts) {
  const current = existsSync(a.path) ? readFileSync(a.path, 'utf8') : null

  if (CHECK) {
    // 校验时忽略生成时间等易变行：本项目产物不含时间戳，直接全量比对
    if (current !== a.content) {
      console.error(`[gen-entry] ✗ 与契约不同步: ${a.path}`)
      drifted++
    } else {
      console.log(`[gen-entry] ✓ 同步: ${a.path}`)
    }
    continue
  }

  if (current === a.content) {
    console.log(`[gen-entry] = 无变化: ${a.path}`)
  } else {
    writeFileSync(a.path, a.content)
    console.log(`[gen-entry] + 已生成: ${a.path}  (${a.desc})`)
  }
}

if (CHECK && drifted) {
  console.error(`\n[gen-entry] ${drifted} 个文件与契约不同步，请运行: node scripts/gen-entry.mjs`)
  process.exit(1)
}
if (CHECK) {
  console.log('[gen-entry] 全部产物与契约一致')
}
