<template>
  <div class="dropdown-container">
    <div
      ref="triggerRef"
      class="dropdown-trigger"
      :class="{ 'dropdown-disabled': disabled, 'dropdown-focused': isOpen }"
      @click="toggleDropdown"
    >
      <span v-if="selectedLabel" class="dropdown-selected">{{ selectedLabel }}</span>
      <span v-else class="dropdown-placeholder">{{ placeholder }}</span>
      <svg
        class="dropdown-arrow"
        :class="{ 'dropdown-arrow-rotate': isOpen }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </div>

    <Teleport to="body">
      <div v-if="isOpen" ref="menuRef" class="dropdown-menu" :style="menuStyle">
        <div
          v-for="option in options"
          :key="option.value"
          class="dropdown-item"
          :class="{ 'dropdown-item-selected': modelValue === option.value }"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </div>
        <div v-if="!options.length" class="dropdown-item dropdown-item-empty">
          暂无可选项
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

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

const floatingGap = 8
const viewportMargin = 12

const selectedLabel = computed(() => {
  const option = props.options.find((item) => item.value === props.modelValue)
  return option?.label || ''
})

const toggleDropdown = async () => {
  if (props.disabled) return

  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    updateMenuPosition()
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
  const menuWidth = rect.width
  const menuHeight = menuRef.value.offsetHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const shouldOpenUp = rect.bottom + floatingGap + menuHeight > viewportHeight - viewportMargin

  const maxLeft = viewportWidth - menuWidth - viewportMargin
  const left = Math.min(Math.max(rect.left, viewportMargin), Math.max(viewportMargin, maxLeft))
  const top = shouldOpenUp
    ? Math.max(viewportMargin, rect.top - menuHeight - floatingGap)
    : Math.min(rect.bottom + floatingGap, viewportHeight - menuHeight - viewportMargin)

  menuStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${menuWidth}px`,
    zIndex: 10000,
    maxHeight: '280px',
    overflowY: 'auto',
    transformOrigin: shouldOpenUp ? 'bottom center' : 'top center'
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

const handleViewportChange = () => {
  if (!isOpen.value) return

  nextTick(() => {
    updateMenuPosition()
  })
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleViewportChange)
  document.addEventListener('scroll', handleViewportChange, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleViewportChange)
  document.removeEventListener('scroll', handleViewportChange, true)
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
  min-height: 50px;
  padding: 12px 16px;
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  user-select: none;
  gap: 10px;
}

.dropdown-trigger:hover {
  border-color: rgba(22, 163, 74, 0.35);
}

.dropdown-focused {
  border-color: rgba(22, 163, 74, 0.35);
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
}

.dropdown-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.dropdown-selected {
  color: var(--text-strong);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-placeholder {
  color: var(--text-muted);
}

.dropdown-arrow {
  transition: transform 0.2s;
  color: var(--text-muted);
  flex-shrink: 0;
}

.dropdown-arrow-rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  box-shadow: 0 18px 38px rgba(21, 45, 33, 0.12);
  padding: 8px;
  z-index: 10000;
  backdrop-filter: blur(12px);
}

.dropdown-item {
  padding: 11px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  color: var(--text-base);
  user-select: none;
}

.dropdown-item:hover {
  background: var(--surface-subtle);
}

.dropdown-item-selected {
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 700;
}

.dropdown-item-empty {
  color: var(--text-muted);
  cursor: default;
}

.dropdown-item-empty:hover {
  background: transparent;
}
</style>
