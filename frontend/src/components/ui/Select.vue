<template>
  <div class="relative">
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="[
        'input',
        'appearance-none bg-white bg-no-repeat bg-right pr-10',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      ]"
      style="background-image: url('data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e'); background-position: right 0.5rem center; background-size: 1.5em 1.5em;"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true,
    default: () => []
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
