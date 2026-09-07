import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const devHost = process.env.__REPAY_RECORD_DEV_HOST__ || process.env.VITE_DEV_HOST || '127.0.0.1'
const devPort = Number(process.env.__REPAY_RECORD_DEV_PORT__ || process.env.VITE_DEV_PORT || 9002)

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: devHost,
    port: devPort,
    strictPort: true,
    open: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9502',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue')) return 'vue-vendor'
          if (id.includes('node_modules/vue-router')) return 'vue-vendor'
          if (id.includes('src/services/echarts-pie.js')) return 'charts-pie'
          if (id.includes('src/services/echarts-trend.js')) return 'charts-trend'
          if (id.includes('node_modules/dayjs')) return 'dayjs'
          if (id.includes('node_modules/axios')) return 'axios'
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'dayjs', 'axios'],
    exclude: ['echarts']
  }
})
