import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import './styles/global.css'
import Message from './components/ui/Message.vue'

// 过滤浏览器插件导致的错误
window.addEventListener('error', (event) => {
  if (event.message?.includes('chrome-extension://') || 
      event.filename?.includes('chrome-extension://')) {
    event.preventDefault()
    console.warn('忽略浏览器插件错误:', event.message)
  }
})

window.addEventListener('unhandledrejection', (event) => {
  if (String(event.reason)?.includes('chrome-extension://')) {
    event.preventDefault()
    console.warn('忽略浏览器插件 Promise 错误:', event.reason)
  }
})

const app = createApp(App)
app.component('Message', Message)
app.use(router)

// 更新站点标题
try { document.title = '借款还款管理平台' } catch (_) {}

app.mount('#app')

// 设置 dayjs 中文
dayjs.locale('zh-cn')
