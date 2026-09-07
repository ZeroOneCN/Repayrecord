<template>
  <div>
    <Message />
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { settingsAPI } from '@/services/api'
import { applyPreferences } from '@/services/preferences'

onMounted(async () => {
  try {
    const prefs = await settingsAPI.getAll()
    if (prefs && Object.keys(prefs).length > 0) {
      applyPreferences(prefs)
    }
  } catch (error) {
    console.warn('同步远端设置失败，继续使用本地设置', error)
  }
})
</script>
