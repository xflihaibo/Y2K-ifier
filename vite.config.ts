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
        name: 'Y2K-ifier',
        version: pkg.version,
        description: pkg.description,
        permissions: ['scripting', 'storage', 'tabs', 'activeTab'],
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
