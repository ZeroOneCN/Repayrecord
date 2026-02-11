const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0',
    port: 9002,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9502',
        changeOrigin: true
      }
    }
  }
})