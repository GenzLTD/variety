/**
 * 书店预渲染留下的收录标记。
 * 无标记、损坏或 count=0：不把 /blog 当作可引用页。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function readBookstoreIndexable(distDir) {
  const file = join(distDir, '.bookstore-indexable.json')
  if (!existsSync(file)) return { indexable: false, count: 0 }
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    const count = Number(data.count) || 0
    return { indexable: data.indexable === true && count > 0, count }
  } catch {
    return { indexable: false, count: 0 }
  }
}
