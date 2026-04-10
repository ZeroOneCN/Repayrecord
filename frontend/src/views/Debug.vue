<template>
  <div style="padding: 20px; font-family: sans-serif;">
    <h1 style="color: #1677ff;">借款还款管理平台</h1>
    <p>应用已启动！正在初始化...</p>
    <div id="debug-info" style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
      <h3>调试信息：</h3>
      <p>Vue 版本：{{ vueVersion }}</p>
      <p>当前路由：{{ currentRoute }}</p>
      <p>错误信息：{{ errorMessage || '无' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const vueVersion = ref('3.x')
const currentRoute = ref('loading...')
const errorMessage = ref('')

const router = useRouter()

onMounted(() => {
  try {
    currentRoute.value = router.currentRoute.value?.path || 'unknown'
    console.log('应用已挂载，当前路由:', currentRoute.value)
  } catch (e) {
    errorMessage.value = e.message
    console.error('挂载错误:', e)
  }
})
</script>
