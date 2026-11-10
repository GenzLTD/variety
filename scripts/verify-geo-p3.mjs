#!/usr/bin/env node
/**
 * verify-geo-p3.mjs — GEO P3 引用监测脚手架 + 事实卡断言
 *
 * 检查：
 *   - docs/geo 固定问卷与 ≥2 轮存档存在
 *   - dist/about 含公司事实卡与禁止虚构
 *   - llms.txt 含最后核实与监测指针
 *   - 不要求生成引擎 API
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const DIR = resolve(ROOT, process.argv.find((a) => a.startsWith('--dir='))?.slice(6) || 'dist')

const errors = []
const ok = (m) => console.log('[geo-p3] ✓ ' + m)
const fail = (m) => {
  errors.push(m)
  console.error('[geo-p3] ✗ ' + m)
}

function readRoot(rel) {
  const p = join(ROOT, rel)
  if (!existsSync(p)) {
    fail('缺少 ' + rel)
    return null
  }
  return readFileSync(p, 'utf8')
}

function readDist(rel) {
  const p = join(DIR, rel)
  if (!existsSync(p)) {
    fail('缺少 dist/' + rel)
    return null
  }
  return readFileSync(p, 'utf8')
}

const q = readRoot('docs/geo/citation-questionnaire.md')
if (q) {
  if (!/深伯乐（深圳）科技有限公司是做什么的/.test(q)) fail('问卷缺题 1 原文')
  else ok('固定问卷题干存在')
  if (!/\+2/.test(q) || !/[\u2212\-]2/.test(q) || !/[\u2212\-]3/.test(q)) fail('问卷缺记分规则')
  else ok('记分规则存在')
  if (/收录 API|submit.*api/i.test(q) && /发明/.test(q) === false) {
    /* allow discussing that we do NOT invent APIs */
  }
}

const roundsDir = join(ROOT, 'docs', 'geo', 'rounds')
if (!existsSync(roundsDir)) fail('缺少 docs/geo/rounds')
else {
  const rounds = readdirSync(roundsDir).filter((f) => /^20\d{2}-\d{2}-\d{2}-r\d+/.test(f) && f.endsWith('.md'))
  if (rounds.length < 2) fail('轮次存档不足 2（当前 ' + rounds.length + '）')
  else ok('轮次存档 ≥2：' + rounds.sort().join(', '))
}

const tls = readRoot('docs/geo/tls-and-legacy-domains.md')
if (tls) {
  if (!/szbolent\.com\.conf/.test(tls)) fail('TLS 文档未标明现役 conf')
  else ok('TLS/旧域文档含现役 conf')
}

const about = readDist('about/index.html')
if (about) {
  if (!/data-geo-fact-card/.test(about)) fail('/about 缺少公司事实卡标记')
  else ok('/about 含公司事实卡')
  if (!/禁止虚构/.test(about)) fail('/about 事实卡缺少禁止虚构声明')
  else ok('/about 含禁止虚构')
  if (!/深伯乐（深圳）科技有限公司/.test(about)) fail('/about 缺公司全称')
  else ok('/about 含公司全称')
}

const llms = readDist('llms.txt') || readRoot('public/llms.txt')
if (llms) {
  if (!/最后核实/.test(llms)) fail('llms.txt 缺最后核实')
  else ok('llms.txt 含最后核实')
  if (!/citation-questionnaire/.test(llms)) fail('llms.txt 未指向监测问卷')
  else ok('llms.txt 指向监测问卷')
  if (!/不冒充/.test(llms) && !/橱窗与入口/.test(llms)) fail('llms.txt 缺入口/非产品文档叙事')
  else ok('llms.txt 含橱窗入口叙事')
}

const readme = readRoot('README.md')
if (readme && !/deploy\/nginx\/szbolent\.com\.conf/.test(readme)) fail('README 未消歧现役 nginx conf')
else if (readme) ok('README 已消歧现役 nginx')

if (errors.length) {
  console.error('[geo-p3] ' + errors.length + ' 项失败')
  process.exit(1)
}
console.log('[geo-p3] 全部通过 @ ' + DIR)