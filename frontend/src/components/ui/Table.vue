<template>
  <div class="table-container">
    <table class="table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" :style="{ width: column.width }">
            {{ column.title }}
          </th>
          <th v-if="$slots.actions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in data" :key="item.id || index">
          <td v-for="column in columns" :key="column.key">
            <slot :name="`cell-${column.key}`" :record="item" :index="index">
              {{ item[column.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions">
            <slot name="actions" :record="item" :index="index" />
          </td>
        </tr>
        <tr v-if="data.length === 0">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="text-center py-12">
            <div class="text-neutral-400">
              <slot name="empty">暂无数据</slot>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  }
})
</script>
