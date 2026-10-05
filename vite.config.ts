/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

// https://vitejs.dev/config/
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// ── 入口契约（分流唯一真源：contracts/entry.json）────────────────────────
// 改分流规则请改契约文件，不要在下面手写 proxy。生产 nginx 由同一份契约生成：
//   node scripts/gen-entry.mjs
interface EntryUpstream {
  desc?: string;
  dev: string;
  prod: string;
  env?: string;
  proxyHostHeader?: string;
}
interface EntryContract {
  version: number;
  /** env: 端口的环境变量出口，供成员在不改共享契约的前提下适配本机端口占用 */
  dev: { port: number; host: string; env?: string };
  upstreams: Record<string, EntryUpstream>;
  routes: Array<{ prefix: string; upstream: string; desc?: string }>;
}

const entry: EntryContract = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'contracts/entry.json'), 'utf-8')
);

/**
 * 契约 → vite proxy。
 * key 的顺序即匹配优先级：/v1/menus|pages|permissions 必须排在兜底 /v1 之前，
 * 次序由 contracts/entry.json 的 routes 数组保证（生成器有校验）。
 */
function buildProxy(): Record<string, { target: string; changeOrigin: boolean }> {
  const proxy: Record<string, { target: string; changeOrigin: boolean }> = {};
  for (const route of entry.routes) {
    const up = entry.upstreams[route.upstream];
    if (!up) {
      throw new Error(`[entry] route ${route.prefix} 指向未定义的上游: ${route.upstream}`);
    }
    proxy[route.prefix] = {
      target: (up.env && process.env[up.env]) || up.dev,
      changeOrigin: true,
    };
  }
  return proxy;
}

/**
 * 页脚注脚用的发布 tag。
 * CI 打 v* tag 时用 GITHUB_REF_NAME，线上看到的字就是回滚要用的 tag。
 * 本地不在 tag 上，或工作区有未提交改动，会带上 sha / +dirty，避免当成可回滚版本。
 */
function resolveReleaseTag(): string {
  const ciTag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : '';
  if (ciTag) return ciTag;

  const git = (command: string): string =>
    execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

  let tag = '';
  let sha = 'unknown';
  let dirty = false;
  try {
    tag = git('git describe --tags --exact-match HEAD');
  } catch {
    tag = '';
  }
  try {
    sha = git('git rev-parse --short HEAD');
  } catch {
    sha = 'unknown';
  }
  try {
    dirty = git('git status --porcelain').length > 0;
  } catch {
    dirty = false;
  }

  if (tag) return dirty ? `${tag}+dirty` : tag;
  return dirty ? `untagged@${sha}+dirty` : `untagged@${sha}`;
}

/**
 * 契约 → 开发端口。
 * env 出口：成员本机 3000 被占用时，设 VITE_DEV_PORT=3xxx 即可，
 * 不必改共享契约（改契约会进 diff、影响所有人），这是「适配度」的收敛点。
 */
function resolveDevPort(dev: EntryContract['dev']): number {
  const raw = dev.env ? process.env[dev.env] : undefined;
  if (!raw) return dev.port;
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`[entry] ${dev.env}="${raw}" 不是合法端口（应为 1-65535 的整数）`);
  }
  return port;
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    __RELEASE_TAG__: JSON.stringify(resolveReleaseTag()),
  },
  plugins: [vue(),
  // 自动导入 Vue 相关函数
  AutoImport({
    imports: ['vue', 'vue-router', 'pinia'],
    dts: 'src/auto-imports.d.ts'
  }),
  // 自动导入组件
  Components({
    dts: 'src/components.d.ts'
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: resolveDevPort(entry.dev),
    host: entry.dev.host,
    open: true,
    proxy: buildProxy()
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
  },
  test: {
    projects: [{
      extends: true,
      test: {
        name: 'unit',
        include: ['tests/unit/**/*.test.ts'],
        environment: 'node',
      },
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});
