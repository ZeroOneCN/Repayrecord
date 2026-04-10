<template>
  <div class="message-container">
    <transition-group name="message-fade">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message', `message-${msg.type}`]"
      >
        <span class="message-icon">{{ msg.icon }}</span>
        <span class="message-content">{{ msg.content }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const messages = ref([])
    let idCounter = 0

    const showMessage = (content, type = 'info') => {
      const id = idCounter++
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      }
      
      messages.value.push({
        id,
        content,
        type,
        icon: icons[type] || icons.info
      })
      
      setTimeout(() => {
        messages.value = messages.value.filter(m => m.id !== id)
      }, 3000)
    }

    const message = {
      success: (content) => showMessage(content, 'success'),
      error: (content) => showMessage(content, 'error'),
      warning: (content) => showMessage(content, 'warning'),
      info: (content) => showMessage(content, 'info')
    }

    onMounted(() => {
      window.$message = message
    })

    return {
      messages
    }
  }
}
</script>

<style scoped>
.message-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 15px;
  font-weight: 500;
  pointer-events: auto;
  min-width: 280px;
  backdrop-filter: blur(8px);
}

.message-success {
  background: rgba(246, 255, 237, 0.95);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.2);
}

.message-error {
  background: rgba(255, 241, 240, 0.95);
  color: #ff4d4f;
  border: 1px solid rgba(255, 77, 79, 0.2);
}

.message-warning {
  background: rgba(255, 251, 230, 0.95);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.2);
}

.message-info {
  background: rgba(230, 244, 255, 0.95);
  color: #1677ff;
  border: 1px solid rgba(22, 119, 255, 0.2);
}

.message-icon {
  font-size: 18px;
  font-weight: 600;
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
