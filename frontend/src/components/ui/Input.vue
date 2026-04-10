<template>
  <div class="relative">
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'input',
        'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      ]"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <slot name="prefix" />
    <slot name="suffix" />
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
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

defineEmits(['update:modelValue'])
</script>
