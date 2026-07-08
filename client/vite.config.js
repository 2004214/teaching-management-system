import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署: 站点会挂在 https://<user>.github.io/<repo>/ 下,
// 所有资源引用必须带 /<repo>/ 前缀. 通过 VITE_BASE_URL 或默认 repo 名注入.
// 本地 dev / Vercel 部署时可以留空或设为 '/'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'
  const base = env.VITE_BASE_URL || '/'

  return {
    plugins: [vue()],
    base,
    server: {
      port: 3000,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'element-vendor': ['element-plus', '@element-plus/icons-vue']
          }
        }
      }
    }
  }
})
