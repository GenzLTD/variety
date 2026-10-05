#!/usr/bin/env node
/**
 * gen-menus.mjs — 把 Page Engine 的菜单种子导出为「烘焙进构建」的 JSON
 *
 * 背景：门户菜单原本在运行时向 Page Engine :5300 拉 GET /v1/menus。
 * 5300 从未纳入部署流水线（deploy.yml 只发前端 dist），线上因此 404、
 * 顶部导航只剩静态「书店」。菜单本质是配置不是运行时数据，故烘焙进构建。
 *
 * 真源（唯一）：
 *   backend/migrations/002_seed.sql            share_menus 初始种子
 *   backend/migrations/003_seed_extended.sql   改 path / 补 component / 新增菜单
 *
 * 产物：src/menus/<product>.json — 进仓、走 PR、可 review、可回退。
 *
 * 用法：
 *   node scripts/gen-menus.mjs           重新生成
 *   node scripts/gen-menus.mjs --check   只校验产物是否与种子同步（CI 门禁）
 *
 * 零依赖，只用 node 内置模块。种子改了而产物没重生 → --check 退出码 1。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SEEDS = [
  join(ROOT, 'backend/migrations/002_seed.sql'),
  join(ROOT, 'backend/migrations/003_seed_extended.sql'),
]
const OUT_DIR = join(ROOT, 'src/menus')
const CHECK = process.argv.includes('--check')

/** INSERT 语句的列顺序 → MenuItem 的驼峰字段名 */
const COLUMNS = {
  id: 'id',
  parent_id: 'parentId',
  title: 'title',
  path: 'path',
  icon: 'icon',
  component: 'component',
  product: 'product',
  visible_to: 'visibleTo',
  sort_order: 'sortOrder',
}

// ── SQL 小解析器（只覆盖种子里实际用到的语法，别的地方不要复用）──────────

/** 按顶层逗号切分，跳过字符串字面量里的逗号 */
function splitByComma(input) {
  const parts = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuote) {
      cur += ch
      if (ch === "'") inQuote = false
      continue
    }
    if (ch === "'") {
      inQuote = true
      cur += ch
      continue
    }
    if (ch === ',') {
      parts.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

/** 取出一段 SQL body 里的所有顶层 (...) 元组内容 */
function extractTuples(body) {
  const out = []
  let cur = ''
  let depth = 0
  let inQuote = false
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (inQuote) {
      cur += ch
      if (ch === "'") inQuote = false
      continue
    }
    if (ch === "'") {
      inQuote = true
      cur += ch
      continue
    }
    if (ch === '(') {
      depth++
      if (depth === 1) {
        cur = ''
        continue
      }
    }
    if (ch === ')') {
      depth--
      if (depth === 0) {
        out.push(cur)
        cur = ''
        continue
      }
    }
    if (depth > 0) cur += ch
  }
  return out
}

/** 'abc' → abc；NULL → null；123 → 123 */
function toJsValue(raw) {
  const v = raw.trim()
  if (v.toUpperCase() === 'NULL') return null
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1)
  const n = Number(v)
  return Number.isFinite(n) ? n : v
}

function parseMenus(sql) {
  const rows = []

  // INSERT INTO share_menus (...) VALUES (...),(...);
  const insertRe =
    /INSERT INTO share_menus\s*\(([^)]*)\)\s*VALUES([\s\S]*?)(?:ON DUPLICATE KEY UPDATE|;)/g
  let m
  while ((m = insertRe.exec(sql)) !== null) {
    const cols = splitByComma(m[1]).map((c) => c.trim())
    for (const tuple of extractTuples(m[2])) {
      const vals = splitByComma(tuple)
      if (vals.length !== cols.length) {
        throw new Error(
          `[gen-menus] 元组字段数与列数不一致：${vals.length} != ${cols.length}\n${tuple}`
        )
      }
      const row = {}
      cols.forEach((col, i) => {
        const key = COLUMNS[col]
        if (!key) throw new Error(`[gen-menus] 未知列 ${col}（种子改了字段要先改 COLUMNS）`)
        row[key] = toJsValue(vals[i])
      })
      rows.push(row)
    }
  }

  // UPDATE share_menus SET ... WHERE product = '...' AND path = '...';
  const updateRe =
    /UPDATE share_menus\s+SET\s+([^;]*?)\s+WHERE\s+product\s*=\s*'([^']+)'\s+AND\s+path\s*=\s*'([^']+)'/g
  while ((m = updateRe.exec(sql)) !== null) {
    const [, setClause, product, oldPath] = m
    // target 必须在赋值前定位一次：SET 里可能就改了 path，
    // 若每条赋值都重新按 oldPath 找，第二条会找不到已被改名的行。
    const target = rows.find((r) => r.product === product && r.path === oldPath)
    if (!target) {
      throw new Error(`[gen-menus] UPDATE 找不到目标：product=${product} path=${oldPath}`)
    }
    for (const assign of splitByComma(setClause)) {
      const eq = assign.indexOf('=')
      if (eq < 0) continue
      const col = assign.slice(0, eq).trim()
      const key = COLUMNS[col]
      if (!key) throw new Error(`[gen-menus] UPDATE 里出现未知列 ${col}`)
      target[key] = toJsValue(assign.slice(eq + 1))
    }
  }

  return rows
}

// ── 主流程 ──────────────────────────────────────────────────────────────

// 先全部 INSERT 收集完，再统一应用 UPDATE：003 的 UPDATE 改的是 002 插进去的行，
// 必须跨文件按同一批 rows 处理，否则会找不到目标。
const mergedSql = SEEDS.map((file) => {
  if (!existsSync(file)) throw new Error(`[gen-menus] 种子文件不存在：${file}`)
  return readFileSync(file, 'utf8')
}).join('\n')

const rows = parseMenus(mergedSql)

if (rows.length === 0) throw new Error('[gen-menus] 没解析出任何菜单行，种子格式变了？')

const byProduct = new Map()
for (const row of rows) {
  if (!byProduct.has(row.product)) byProduct.set(row.product, [])
  byProduct.get(row.product).push(row)
}

let drift = false
for (const [product, items] of byProduct) {
  items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
  const out = {
    // 产物说明写进文件里，避免后人误以为这是手写的常量
    $comment:
      '烘焙菜单 —— 由 scripts/gen-menus.mjs 从 backend/migrations/00{2,3}*.sql 导出，禁止手改。改菜单请改种子后重跑脚本，或走 PR 说明。',
    product,
    source: ['backend/migrations/002_seed.sql', 'backend/migrations/003_seed_extended.sql'],
    items,
  }
  const content = JSON.stringify(out, null, 2) + '\n'
  const file = join(OUT_DIR, `${product}.json`)

  if (!existsSync(file)) {
    if (CHECK) {
      console.error(`[gen-menus] 缺少产物：src/menus/${product}.json`)
      drift = true
    }
    mkdirSync(OUT_DIR, { recursive: true })
    writeFileSync(file, content)
    console.log(`[gen-menus] 新增 src/menus/${product}.json（${items.length} 项）`)
    continue
  }

  const current = readFileSync(file, 'utf8')
  if (current !== content) {
    if (CHECK) {
      console.error(
        `[gen-menus] src/menus/${product}.json 与种子不同步，请跑 node scripts/gen-menus.mjs`
      )
      drift = true
    } else {
      writeFileSync(file, content)
      console.log(`[gen-menus] 更新 src/menus/${product}.json（${items.length} 项）`)
    }
  } else {
    console.log(`[gen-menus] src/menus/${product}.json 已同步（${items.length} 项）`)
  }
}

if (CHECK && drift) process.exit(1)
