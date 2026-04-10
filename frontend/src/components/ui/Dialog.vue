<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- 遮罩层 -->
        <div 
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="$emit('update:open', false)"
        />
        
        <!-- 对话框 -->
        <div 
          :class="[
            'relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4',
            'max-h-[90vh] overflow-auto',
            className
          ]"
          @click.stop
        >
          <!-- 头部 -->
          <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h3 class="text-lg font-semibold text-neutral-900">{{ title }}</h3>
            <button 
              class="text-neutral-400 hover:text-neutral-600 transition-colors"
              @click="$emit('update:open', false)"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- 内容 -->
          <div class="px-6 py-4">
            <slot />
          </div>
          
          <!-- 底部 -->
          <div v-if="$slots.footer" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  className: {
    type: String,
    default: ''
  }
})

defineEmits(['update:open'])
</script>
