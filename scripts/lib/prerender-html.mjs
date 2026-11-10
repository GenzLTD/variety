/**
 * 共享：从 dist/index.html 注入 SEO + #app 可爬正文壳
 */
export function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {string} html
 * @param {{ title: string, description: string, canonical: string, ogTitle?: string, body: string }} opts
 */
export function injectSeoAndBody(html, opts) {
  const { title, description, canonical, body } = opts
  const ogTitle = opts.ogTitle || title
  let out = html

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  if (/<meta name="description" content="/i.test(out)) {
    out = out.replace(
      /<meta name="description" content="[^"]*">/i,
      `<meta name="description" content="${escapeHtml(description)}">`
    )
  } else {
    out = out.replace('</head>', `    <meta name="description" content="${escapeHtml(description)}">\n  </head>`)
  }
  out = out.replace(
    /<meta property="og:url" content="[^"]*">/i,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`
  )
  out = out.replace(
    /<meta property="og:title" content="[^"]*">/i,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}">`
  )
  out = out.replace(
    /<meta property="og:description" content="[^"]*">/i,
    `<meta property="og:description" content="${escapeHtml(description)}">`
  )
  if (/rel="canonical"/i.test(out)) {
    out = out.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${escapeHtml(canonical)}">`)
  } else {
    out = out.replace('</head>', `    <link rel="canonical" href="${escapeHtml(canonical)}">\n  </head>`)
  }

  return replaceAppDiv(out, body)
}

/** 按深度匹配替换 `#app`，避免非贪婪正则在壳内出现嵌套 <div> 时提前截断。 */
function replaceAppDiv(html, body) {
  const openRe = /<div id="app"[^>]*>/i
  const m = openRe.exec(html)
  if (!m) {
    return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${body}\n  </body>`) : `${html}\n${body}`
  }
  const openIdx = m.index
  const openEnd = openIdx + m[0].length
  const lower = html.toLowerCase()
  let depth = 1
  let i = openEnd
  while (i < html.length && depth > 0) {
    const nextOpen = lower.indexOf('<div', i)
    const nextClose = lower.indexOf('</div>', i)
    if (nextClose === -1) break
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1
      i = nextOpen + 4
      continue
    }
    depth -= 1
    if (depth === 0) {
      return `${html.slice(0, openIdx)}<div id="app">${body}</div>${html.slice(nextClose + 6)}`
    }
    i = nextClose + 6
  }
  // 空壳或无法配对时退化为整段追加前的直换
  if (/<div id="app"><\/div>/i.test(html)) {
    return html.replace(/<div id="app"><\/div>/i, `<div id="app">${body}</div>`)
  }
  return html
}
