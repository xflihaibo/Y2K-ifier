import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import webExtension from '@samrum/vite-plugin-web-extension'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  plugins: [
    vue(),
    webExtension({
      manifest: {
        manifest_version: 3,
        name: 'Y2K-ifier: 90s Retro Filter & Web Nostalgia (Vaporwave/Glitch)',
        version: pkg.version,
        description: pkg.description,
        permissions: ['scripting', 'storage', 'tabs', 'activeTab', 'bookmarks', 'downloads'],
        host_permissions: ['<all_urls>'],
        icons: {
          '16': 'icons/icon16.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png',
        },
        action: {
          default_popup: 'src/popup/popup.html',
          default_title: 'Y2K-ifier：复古模式',
          default_icon: {
            '16': 'icons/icon16.png',
            '48': 'icons/icon48.png',
            '128': 'icons/icon128.png',
          },
        },
        background: {
          service_worker: 'src/background/background.ts',
        },
        options_ui: {
          page: 'src/newtab/newtab.html',
          open_in_tab: true,
        },
        commands: {
          open_theme: {
            suggested_key: { default: 'Alt+Shift+Y', mac: 'Alt+Shift+Y' },
            description: 'Open Y2K theme page in a new tab',
          },
        },
        web_accessible_resources: [
          {
            resources: ['styles/retro.css'],
            matches: ['<all_urls>'],
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // 扩展 CSP 禁止 unsafe-eval，使用 runtime 构建避免 vue-i18n 运行时编译 (new Function)
      'vue-i18n': resolve(__dirname, 'node_modules/vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    sourcemap: true,
  },
})
