<template>
  <div class="date-picker-container">
    <!-- 触发器 -->
    <div
      ref="triggerRef"
      class="date-picker-trigger"
      :class="{ 'date-picker-disabled': disabled, 'date-picker-focused': isOpen }"
      @click="toggleDropdown"
    >
      <span v-if="modelValue" class="date-picker-selected">{{ formatDate(modelValue) }}</span>
      <span v-else class="date-picker-placeholder">{{ placeholder }}</span>
      <svg class="date-picker-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </div>

    <!-- 日期面板 -->
    <div v-if="isOpen" class="date-picker-panel" :style="panelStyle" ref="panelRef">
      <!-- 月份选择 -->
      <div v-if="type === 'month'" class="date-picker-month-grid">
        <div class="date-picker-header">
          <button type="button" class="date-picker-nav" @click="prevYear">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <span class="date-picker-year">{{ currentYear }}年</span>
          <button type="button" class="date-picker-nav" @click="nextYear">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>
        <div class="date-picker-months">
          <div
            v-for="(month, index) in months"
            :key="index"
            class="date-picker-month"
            :class="{ 'date-picker-month-selected': isMonthSelected(index + 1) }"
            @click="selectMonth(index + 1)"
          >
            {{ month }}
          </div>
        </div>
      </div>

      <!-- 日期选择 -->
      <div v-else class="date-picker-calendar">
        <div class="date-picker-header">
          <button type="button" class="date-picker-nav" @click="prevMonth">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <span class="date-picker-month-year">{{ currentYear }}年 {{ months[currentMonth] }}</span>
          <button type="button" class="date-picker-nav" @click="nextMonth">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>
        <div class="date-picker-weekdays">
          <span v-for="day in weekdays" :key="day" class="date-picker-weekday">{{ day }}</span>
        </div>
        <div class="date-picker-days">
          <div
            v-for="day in daysInMonth"
            :key="day"
            class="date-picker-day"
            :class="{
              'date-picker-day-selected': isDaySelected(day),
              'date-picker-day-today': isToday(day),
              'date-picker-day-empty': day === 0
            }"
            @click="day > 0 && selectDay(day)"
          >
            {{ day > 0 ? day : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'date',
    validator: (v) => ['date', 'month'].includes(v)
  },
  placeholder: {
    type: String,
    default: '选择日期'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)
const panelStyle = ref({})

const currentDate = ref(dayjs())
const currentYear = computed(() => currentDate.value.year())
const currentMonth = computed(() => currentDate.value.month())

const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const daysInMonth = computed(() => {
  const startDay = currentDate.value.startOf('month').day()
  const days = currentDate.value.daysInMonth()
  const result = []
  for (let i = 0; i < startDay; i++) {
    result.push(0)
  }
  for (let i = 1; i <= days; i++) {
    result.push(i)
  }
  return result
})

const formatDate = (value) => {
  if (!value) return ''
  if (props.type === 'month') {
    return dayjs(value).format('YYYY-MM')
  }
  return dayjs(value).format('YYYY-MM-DD')
}

const isMonthSelected = (month) => {
  if (!props.modelValue) return false
  const selected = dayjs(props.modelValue)
  return selected.year() === currentYear.value && selected.month() === month - 1
}

const isDaySelected = (day) => {
  if (!props.modelValue) return false
  const selected = dayjs(props.modelValue)
  return selected.year() === currentYear.value &&
         selected.month() === currentMonth.value &&
         selected.date() === day
}

const isToday = (day) => {
  const today = dayjs()
  return today.year() === currentYear.value &&
         today.month() === currentMonth.value &&
         today.date() === day
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    if (props.modelValue) {
      currentDate.value = dayjs(props.modelValue)
    }
    nextTick(() => {
      updatePanelPosition()
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectMonth = (month) => {
  const selected = currentDate.value.month(month - 1)
  emit('update:modelValue', selected.format('YYYY-MM'))
  emit('change', selected.format('YYYY-MM'))
  closeDropdown()
}

const selectDay = (day) => {
  const selected = currentDate.value.date(day)
  emit('update:modelValue', selected.format('YYYY-MM-DD'))
  emit('change', selected.format('YYYY-MM-DD'))
  closeDropdown()
}

const prevYear = () => {
  currentDate.value = currentDate.value.subtract(1, 'year')
}

const nextYear = () => {
  currentDate.value = currentDate.value.add(1, 'year')
}

const prevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month')
}

const updatePanelPosition = () => {
  if (!triggerRef.value || !panelRef.value) return
  
  const rect = triggerRef.value.getBoundingClientRect()
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft
  
  panelStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + scrollTop + 8}px`,
    left: `${rect.left + scrollLeft}px`,
    zIndex: 10000,
    width: '280px'
  }
}

const handleClickOutside = (event) => {
  if (!isOpen.value) return
  
  const isClickOnTrigger = triggerRef.value?.contains(event.target)
  const isClickOnPanel = panelRef.value?.contains(event.target)
  
  if (!isClickOnTrigger && !isClickOnPanel) {
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
.date-picker-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.date-picker-trigger {
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
  gap: 10px;
}

.date-picker-trigger:hover {
  border-color: #1677ff;
}

.date-picker-focused {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.date-picker-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.date-picker-selected {
  color: #141414;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-picker-placeholder {
  color: #8c8c8c;
  flex: 1;
}

.date-picker-icon {
  color: #8c8c8c;
  flex-shrink: 0;
}

.date-picker-panel {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 16px;
  z-index: 10000;
}

.date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 8px;
}

.date-picker-nav {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #595959;
  transition: all 0.2s;
  user-select: none;
}

.date-picker-nav:hover {
  background: #e6f4ff;
  color: #1677ff;
}

.date-picker-year, .date-picker-month-year {
  font-size: 15px;
  font-weight: 600;
  color: #141414;
}

.date-picker-months {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.date-picker-month {
  padding: 12px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #595959;
  user-select: none;
}

.date-picker-month:hover {
  background: #f5f5f5;
}

.date-picker-month-selected {
  background: #e6f4ff;
  color: #1677ff;
  font-weight: 600;
}

.date-picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.date-picker-weekday {
  text-align: center;
  font-size: 13px;
  color: #8c8c8c;
  padding: 8px 0;
}

.date-picker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.date-picker-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #595959;
  user-select: none;
}

.date-picker-day:hover:not(.date-picker-day-empty) {
  background: #f5f5f5;
}

.date-picker-day-selected {
  background: #1677ff;
  color: white;
  font-weight: 600;
}

.date-picker-day-today:not(.date-picker-day-selected) {
  border: 1px solid #1677ff;
  color: #1677ff;
}

.date-picker-day-empty {
  cursor: default;
}
</style>
