<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :class="[
      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
      'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      modelValue ? 'bg-primary' : 'bg-neutral-200'
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      :class="[
        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
        'transition duration-200 ease-in-out',
        modelValue ? 'translate-x-5' : 'translate-x-0'
      ]"
    />
  </button>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>
