<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="[
      'toggle-switch',
      modelValue ? 'toggle-switch-on' : 'toggle-switch-off',
      disabled ? 'toggle-switch-disabled' : ''
    ]"
    @click="handleClick"
  >
    <span :class="['toggle-switch-thumb', modelValue ? 'toggle-switch-thumb-on' : '']" />
  </button>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleClick = () => {
  if (props.disabled) return

  const nextValue = !props.modelValue
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}
</script>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-flex;
  width: 52px;
  min-width: 52px;
  height: 30px;
  padding: 3px;
  border: 0;
  border-radius: 999px;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  background: var(--toggle-off);
}

.toggle-switch:focus-visible {
  outline: 2px solid rgba(22, 163, 74, 0.18);
  outline-offset: 2px;
}

.toggle-switch-on {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
}

.toggle-switch-off {
  background: var(--toggle-off);
}

.toggle-switch-disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.toggle-switch-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease;
}

.toggle-switch-thumb-on {
  transform: translateX(22px);
}
</style>
