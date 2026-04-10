<template>
  <span :class="['badge', variantClasses[variant], className]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warning', 'error', 'neutral'].includes(v)
  },
  className: {
    type: String,
    default: ''
  }
})

const variantClasses = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  neutral: 'bg-neutral-100 text-neutral-600'
}
</script>
