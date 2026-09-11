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
 *
 * 零依赖，只用 node 内置模块。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTRACT_PATH = join(ROOT, 'contracts/entry.json')
const CHECK = process.argv.includes('--check')

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

  // 保留域名（别人家的站）不得被本仓站点声明，否则会抢站。
  // 依据 2026-09-12 阿里云实地勘察：szbolent.cn / www.szbolent.cn 归 poetries-h5。
  for (const site of Object.values(c.sites || {})) {
    const reserved = Object.keys(site.reservedDomains || {})
    if (!reserved.length) continue
    const clash = (site.serverNames || []).filter((n) => reserved.includes(n))
    if (clash.length) {
      errs.push(
        `${site.file} 声明了保留域名 ${clash.join(', ')} —— ${site.reservedDomains[clash[0]]} 在用，会抢站`
      )
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

/** 生成门户入口（含契约里的全部分流） */
function renderPortal(site) {
  const out = [header(site.file, site.desc), '']
  out.push('server {')

  const listens = [`    listen ${site.listen}${site.defaultServer ? ' default_server' : ''};`]
  if (site.listen === 80) listens.push('    listen [::]:80;')
  out.push(...listens)
  out.push(`    server_name ${site.serverNames.join(' ')};`)
  out.push('')
  out.push(`    client_max_body_size ${site.clientMaxBodySize || '64m'};`)
  out.push('    charset utf-8;')

  if (site.gzip) {
    out.push('')
    out.push('    gzip on;')
    out.push('    gzip_vary on;')
    out.push('    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;')
    out.push('    gzip_min_length 256;')
  }

  // location / — 门户 / 内容站切换点
  const dl = site.defaultLocation
  out.push('')
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

  out.push('}')
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
