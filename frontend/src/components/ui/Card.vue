<template>
  <div :class="['card', className]">
    <div v-if="title || $slots.header" :class="['border-b border-neutral-100 px-6 py-4', headerClass]">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-neutral-900">{{ title }}</h3>
      </slot>
    </div>
    <div :class="['p-6', contentClass]">
      <slot />
    </div>
    <div v-if="$slots.footer" :class="['border-t border-neutral-100 px-6 py-4', footerClass]">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  className: {
    type: String,
    default: ''
  },
  headerClass: {
    type: String,
    default: ''
  },
  contentClass: {
    type: String,
    default: ''
  },
  footerClass: {
    type: String,
    default: ''
  }
})
</script>
