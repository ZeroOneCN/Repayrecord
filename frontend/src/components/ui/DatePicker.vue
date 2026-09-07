<template>
  <div class="date-picker-container">
    <div
      ref="triggerRef"
      class="date-picker-trigger"
      :class="{ 'date-picker-disabled': disabled, 'date-picker-focused': isOpen }"
      @click="toggleDropdown"
    >
      <span v-if="modelValue" class="date-picker-selected">{{ formatDisplayValue(modelValue) }}</span>
      <span v-else class="date-picker-placeholder">{{ placeholder }}</span>
      <svg class="date-picker-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </div>

    <Teleport to="body">
      <div v-if="isOpen" ref="panelRef" class="date-picker-panel" :style="panelStyle">
        <div class="date-picker-header">
          <button
            type="button"
            class="date-picker-nav"
            :aria-label="type === 'month' ? '上一年' : '上个月'"
            @click="type === 'month' ? prevYear() : prevMonth()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>

          <div class="date-picker-header-controls">
            <label class="date-picker-select-wrap">
              <span class="sr-only">选择年份</span>
              <select :value="currentYear" class="date-picker-select" @change="handleYearChange">
                <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}年</option>
              </select>
            </label>

            <label v-if="type === 'date'" class="date-picker-select-wrap">
              <span class="sr-only">选择月份</span>
              <select :value="currentMonth" class="date-picker-select" @change="handleMonthChange">
                <option v-for="(month, index) in months" :key="month" :value="index">{{ month }}</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            class="date-picker-nav"
            :aria-label="type === 'month' ? '下一年' : '下个月'"
            @click="type === 'month' ? nextYear() : nextMonth()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        <div v-if="type === 'month'" class="date-picker-months">
          <button
            v-for="(month, index) in months"
            :key="month"
            type="button"
            class="date-picker-month"
            :class="{ 'date-picker-month-selected': isMonthSelected(index) }"
            @click="selectMonth(index)"
          >
            {{ month }}
          </button>
        </div>

        <div v-else class="date-picker-calendar">
          <div class="date-picker-weekdays">
            <span v-for="day in weekdays" :key="day" class="date-picker-weekday">{{ day }}</span>
          </div>
          <div class="date-picker-days">
            <button
              v-for="(day, index) in daysInMonth"
              :key="`${currentYear}-${currentMonth}-${index}`"
              type="button"
              class="date-picker-day"
              :class="{
                'date-picker-day-selected': isDaySelected(day),
                'date-picker-day-today': isToday(day),
                'date-picker-day-empty': day === 0
              }"
              :disabled="day === 0"
              @click="day > 0 && selectDay(day)"
            >
              {{ day > 0 ? day : '' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'date',
    validator: (value) => ['date', 'month'].includes(value)
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

const floatingGap = 8
const viewportMargin = 12
const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const isOpen = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)
const panelStyle = ref({})
const currentDate = ref(dayjs())

const currentYear = computed(() => currentDate.value.year())
const currentMonth = computed(() => currentDate.value.month())

const yearOptions = computed(() => {
  const todayYear = dayjs().year()
  const focusYear = currentYear.value
  const startYear = Math.min(todayYear, focusYear) - 15
  const endYear = Math.max(todayYear, focusYear) + 5
  const years = []

  for (let year = endYear; year >= startYear; year -= 1) {
    years.push(year)
  }

  return years
})

const daysInMonth = computed(() => {
  const startDay = currentDate.value.startOf('month').day()
  const totalDays = currentDate.value.daysInMonth()
  const days = []

  for (let index = 0; index < startDay; index += 1) {
    days.push(0)
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(day)
  }

  return days
})

const syncCurrentDate = () => {
  currentDate.value = props.modelValue ? dayjs(props.modelValue) : dayjs()
}

const formatDisplayValue = (value) => {
  if (!value) return ''
  return props.type === 'month'
    ? dayjs(value).format('YYYY-MM')
    : dayjs(value).format('YYYY-MM-DD')
}

const updatePanelPosition = () => {
  if (!triggerRef.value || !panelRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const panelWidth = Math.min(320, viewportWidth - viewportMargin * 2)
  const panelHeight = panelRef.value.offsetHeight
  const shouldOpenUp = rect.bottom + floatingGap + panelHeight > viewportHeight - viewportMargin

  const maxLeft = viewportWidth - panelWidth - viewportMargin
  const left = Math.min(Math.max(rect.left, viewportMargin), Math.max(viewportMargin, maxLeft))
  const top = shouldOpenUp
    ? Math.max(viewportMargin, rect.top - panelHeight - floatingGap)
    : Math.min(rect.bottom + floatingGap, viewportHeight - panelHeight - viewportMargin)

  panelStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
    zIndex: 10000,
    transformOrigin: shouldOpenUp ? 'bottom center' : 'top center'
  }
}

const openDropdown = async () => {
  syncCurrentDate()
  isOpen.value = true
  await nextTick()
  updatePanelPosition()
}

const closeDropdown = () => {
  isOpen.value = false
}

const toggleDropdown = async () => {
  if (props.disabled) return

  if (isOpen.value) {
    closeDropdown()
    return
  }

  await openDropdown()
}

const emitValue = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const selectMonth = (monthIndex) => {
  const nextValue = currentDate.value.month(monthIndex).format('YYYY-MM')
  emitValue(nextValue)
  closeDropdown()
}

const selectDay = (day) => {
  const nextValue = currentDate.value.date(day).format('YYYY-MM-DD')
  emitValue(nextValue)
  closeDropdown()
}

const isMonthSelected = (monthIndex) => {
  if (!props.modelValue) return false
  const selected = dayjs(props.modelValue)
  return selected.year() === currentYear.value && selected.month() === monthIndex
}

const isDaySelected = (day) => {
  if (!props.modelValue || day <= 0) return false
  const selected = dayjs(props.modelValue)
  return (
    selected.year() === currentYear.value &&
    selected.month() === currentMonth.value &&
    selected.date() === day
  )
}

const isToday = (day) => {
  if (day <= 0) return false
  const today = dayjs()
  return (
    today.year() === currentYear.value &&
    today.month() === currentMonth.value &&
    today.date() === day
  )
}

const prevYear = async () => {
  currentDate.value = currentDate.value.subtract(1, 'year')
  await nextTick()
  updatePanelPosition()
}

const nextYear = async () => {
  currentDate.value = currentDate.value.add(1, 'year')
  await nextTick()
  updatePanelPosition()
}

const prevMonth = async () => {
  currentDate.value = currentDate.value.subtract(1, 'month')
  await nextTick()
  updatePanelPosition()
}

const nextMonth = async () => {
  currentDate.value = currentDate.value.add(1, 'month')
  await nextTick()
  updatePanelPosition()
}

const handleYearChange = async (event) => {
  const nextYearValue = Number(event.target.value)
  if (Number.isNaN(nextYearValue)) return

  currentDate.value = currentDate.value.year(nextYearValue)
  await nextTick()
  updatePanelPosition()
}

const handleMonthChange = async (event) => {
  const nextMonthValue = Number(event.target.value)
  if (Number.isNaN(nextMonthValue)) return

  currentDate.value = currentDate.value.month(nextMonthValue)
  await nextTick()
  updatePanelPosition()
}

const handleClickOutside = (event) => {
  if (!isOpen.value) return

  const isClickOnTrigger = triggerRef.value?.contains(event.target)
  const isClickOnPanel = panelRef.value?.contains(event.target)
  if (!isClickOnTrigger && !isClickOnPanel) {
    closeDropdown()
  }
}

const handleViewportChange = () => {
  if (!isOpen.value) return

  nextTick(() => {
    updatePanelPosition()
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
.date-picker-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.date-picker-trigger {
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

.date-picker-trigger:hover {
  border-color: rgba(22, 163, 74, 0.35);
}

.date-picker-focused {
  border-color: rgba(22, 163, 74, 0.35);
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
}

.date-picker-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.date-picker-selected {
  color: var(--text-strong);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-picker-placeholder {
  color: var(--text-muted);
  flex: 1;
}

.date-picker-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.date-picker-panel {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  box-shadow: 0 18px 38px rgba(21, 45, 33, 0.12);
  padding: 16px;
  z-index: 10000;
  backdrop-filter: blur(12px);
}

.date-picker-header {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 36px;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.date-picker-header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.date-picker-nav {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--surface-subtle);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-base);
  transition: all 0.2s;
}

.date-picker-nav:hover {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.date-picker-select-wrap {
  min-width: 0;
  flex: 1;
}

.date-picker-select {
  width: 100%;
  min-height: 36px;
  padding: 0 34px 0 12px;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background:
    linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
    linear-gradient(135deg, var(--text-muted) 50%, transparent 50%),
    rgba(247, 251, 248, 0.9);
  background-position:
    calc(100% - 18px) 15px,
    calc(100% - 13px) 15px,
    0 0;
  background-size: 5px 5px, 5px 5px, 100% 100%;
  background-repeat: no-repeat;
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 600;
  appearance: none;
  outline: none;
}

.date-picker-select:focus {
  border-color: rgba(22, 163, 74, 0.35);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.date-picker-months {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.date-picker-month {
  min-height: 42px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--text-base);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.date-picker-month:hover {
  background: var(--surface-subtle);
}

.date-picker-month-selected {
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 700;
}

.date-picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 8px;
}

.date-picker-weekday {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  padding: 8px 0;
}

.date-picker-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.date-picker-day {
  aspect-ratio: 1;
  border: none;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: var(--text-base);
}

.date-picker-day:hover:not(.date-picker-day-empty) {
  background: var(--surface-subtle);
}

.date-picker-day-selected {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}

.date-picker-day-today:not(.date-picker-day-selected) {
  border: 1px solid var(--accent);
  color: var(--accent-strong);
}

.date-picker-day-empty {
  cursor: default;
}

.date-picker-day:disabled {
  pointer-events: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
