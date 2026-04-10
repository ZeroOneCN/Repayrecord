<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg',
      'focus:outline-none focus:ring-2 focus:ring-primary/20',
      variantClasses[variant],
      sizeClasses[size],
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      className
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'success', 'danger', 'outline', 'ghost'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  className: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click'])

const variantClasses = {
  primary: 'bg-primary hover:bg-primary-hover active:bg-primary-active text-white',
  secondary: 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700',
  success: 'bg-success hover:bg-green-600 active:bg-green-700 text-white',
  danger: 'bg-error hover:bg-red-600 active:bg-red-700 text-white',
  outline: 'border-2 border-primary text-primary hover:bg-primary-light',
  ghost: 'text-neutral-600 hover:bg-neutral-100'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg'
}

const handleClick = (e) => {
  if (!props.disabled) {
    emit('click', e)
  }
}
</script>
