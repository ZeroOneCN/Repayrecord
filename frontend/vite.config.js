import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
    host: '0.0.0.0',
    port: 9002,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9502',
        changeOrigin: true
      }
    }
  },
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue')) return 'vue-vendor'
          if (id.includes('node_modules/vue-router')) return 'vue-vendor'
          if (id.includes('node_modules/echarts')) return 'echarts'
          if (id.includes('node_modules/dayjs')) return 'dayjs'
          if (id.includes('node_modules/axios')) return 'axios'
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 资源大小限制
    chunkSizeWarningLimit: 500
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router', 'echarts', 'dayjs', 'axios']
  }
})
