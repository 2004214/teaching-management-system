import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vercel 部署时 VITE_API_BASE_URL 指向 Render 后端, 走完整 URL 不走 proxy
// 本地开发时未设置 VITE_API_BASE_URL, 走下面的 dev proxy 转发到本地后端
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [vue()],
    server: {
      port: 3000,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // 生产包体优化: 分离 vendor 提升缓存命中率
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
