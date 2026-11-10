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

  if (/<div id="app"><\/div>/i.test(out)) {
    out = out.replace(/<div id="app"><\/div>/i, `<div id="app">${body}</div>`)
  } else if (/<div id="app">/i.test(out)) {
    out = out.replace(/<div id="app">[\s\S]*?<\/div>/i, `<div id="app">${body}</div>`)
  } else {
    out = out.replace('</body>', `${body}\n  </body>`)
  }
  return out
}
