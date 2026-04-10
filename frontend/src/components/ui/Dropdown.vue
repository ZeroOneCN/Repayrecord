<template>
  <div class="dropdown-container">
    <!-- 触发器 -->
    <div
      ref="triggerRef"
      class="dropdown-trigger"
      :class="{ 'dropdown-disabled': disabled, 'dropdown-focused': isOpen }"
      @click="toggleDropdown"
    >
      <span v-if="selectedLabel" class="dropdown-selected">{{ selectedLabel }}</span>
      <span v-else class="dropdown-placeholder">{{ placeholder }}</span>
      <svg class="dropdown-arrow" :class="{ 'dropdown-arrow-rotate': isOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </div>

    <!-- 下拉菜单 -->
    <div v-if="isOpen" class="dropdown-menu" :style="menuStyle" ref="menuRef">
      <div
        v-for="option in options"
        :key="option.value"
        class="dropdown-item"
        :class="{ 'dropdown-item-selected': modelValue === option.value }"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const triggerRef = ref(null)
const menuRef = ref(null)
const menuStyle = ref({})

const selectedLabel = computed(() => {
  const option = props.options.find(o => o.value === props.modelValue)
  return option?.label || ''
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      updateMenuPosition()
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeDropdown()
}

const updateMenuPosition = () => {
  if (!triggerRef.value || !menuRef.value) return
  
  const rect = triggerRef.value.getBoundingClientRect()
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft
  
  menuStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + scrollTop + 8}px`,
    left: `${rect.left + scrollLeft}px`,
    width: `${rect.width}px`,
    zIndex: 10000,
    maxHeight: '280px',
    overflowY: 'auto'
  }
}

const handleClickOutside = (event) => {
  if (!isOpen.value) return
  
  const isClickOnTrigger = triggerRef.value?.contains(event.target)
  const isClickOnMenu = menuRef.value?.contains(event.target)
  
  if (!isClickOnTrigger && !isClickOnMenu) {
    closeDropdown()
  }
}

const handleScroll = () => {
  if (isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})
</script>

<style scoped>
.dropdown-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  user-select: none;
}

.dropdown-trigger:hover {
  border-color: #1677ff;
}

.dropdown-focused {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.dropdown-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.dropdown-selected {
  color: #141414;
}

.dropdown-placeholder {
  color: #8c8c8c;
}

.dropdown-arrow {
  transition: transform 0.2s;
  color: #8c8c8c;
  flex-shrink: 0;
}

.dropdown-arrow-rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 10000;
}

.dropdown-item {
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  color: #595959;
  user-select: none;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item-selected {
  background: #e6f4ff;
  color: #1677ff;
  font-weight: 500;
}
</style>
