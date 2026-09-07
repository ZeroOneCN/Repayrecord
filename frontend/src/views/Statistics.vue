<template>
  <AppLayout>
    <div class="page-shell">
      <section class="page-header">
        <div class="page-header-main">
          <span class="page-icon-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M5 19V10" />
              <path d="M12 19V5" />
              <path d="M19 19V13" />
            </svg>
          </span>
          <div>
            <p class="page-kicker">Analytics</p>
            <h1 class="page-title">数据统计</h1>
            <p class="page-description">
              按月份查看账单结构，并按最近 30 天或自定义区间观察还款趋势。平台筛选、图表类型与日期范围都会立即联动。
            </p>
          </div>
        </div>
      </section>

      <section class="surface-card">
        <div class="toolbar">
          <div class="toolbar-group filter-toolbar-group">
            <div class="filter-row">
              <div class="filter-item">
                <DatePicker v-model="statsFilters.month" type="month" placeholder="选择月份" />
              </div>
              <div class="filter-segment-item">
                <div class="toolbar-segment">
                  <button
                    :class="['theme-btn', rangeMode === 'last30' ? 'theme-btn-primary' : 'theme-btn-outline']"
                    @click="setRangeMode('last30')"
                  >
                    最近 30 天
                  </button>
                  <button
                    :class="['theme-btn', rangeMode === 'custom' ? 'theme-btn-primary' : 'theme-btn-outline']"
                    @click="setRangeMode('custom')"
                  >
                    自定义范围
                  </button>
                </div>
              </div>
              <div class="filter-item">
                <Dropdown v-model="selectedPlatformId" :options="platformSelectOptions" placeholder="全部平台" />
              </div>
            </div>
          </div>
          <div class="toolbar-actions">
            <button class="theme-btn theme-btn-outline" :disabled="loading" @click="applyStatsFilters">查询</button>
            <button class="theme-btn theme-btn-secondary" :disabled="loading" @click="resetStatsFilters">重置</button>
            <button class="theme-btn theme-btn-primary" :disabled="loading" @click="applyStatsFilters">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spin: loading }">
                <polyline points="23,4 23,10 17,10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              刷新统计
            </button>
          </div>
        </div>

        <div v-if="rangeMode === 'custom'" class="custom-range-row">
          <DatePicker v-model="customRange.start" type="date" placeholder="开始日期" />
          <DatePicker v-model="customRange.end" type="date" placeholder="结束日期" />
          <span class="range-caption">自定义范围会同时影响趋势图和趋势摘要卡片。</span>
        </div>
      </section>

      <section class="metric-grid metric-grid-5">
        <article class="metric-card">
          <div class="metric-card-head">
            <span class="metric-card-label">总账单数</span>
            <span class="metric-icon metric-icon-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value">{{ Number(monthlyStats.total_bills || 0) }}</p>
          <span class="metric-card-note">当前月份账单数</span>
        </article>

        <article class="metric-card">
          <div class="metric-card-head">
            <span class="metric-card-label">总金额</span>
            <span class="metric-icon metric-icon-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value">¥{{ Number(monthlyStats.total_amount || 0).toFixed(2) }}</p>
          <span class="metric-card-note">当前月份账单金额</span>
        </article>

        <article class="metric-card">
          <div class="metric-card-head">
            <span class="metric-card-label">已还款</span>
            <span class="metric-icon metric-icon-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value">¥{{ Number(monthlyStats.paid_amount || 0).toFixed(2) }}</p>
          <span class="metric-card-note">本月已结清规模</span>
        </article>

        <article class="metric-card">
          <div class="metric-card-head">
            <span class="metric-card-label">未还款</span>
            <span class="metric-icon metric-icon-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value">¥{{ Number(monthlyStats.unpaid_amount || 0).toFixed(2) }}</p>
          <span class="metric-card-note">本月待还账单金额</span>
        </article>

        <article class="metric-card">
          <div class="metric-card-head">
            <span class="metric-card-label">总利息</span>
            <span class="metric-icon metric-icon-danger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
                <polyline points="17,6 23,6 23,12" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value">¥{{ Number(monthlyStats.total_interest || 0).toFixed(2) }}</p>
          <span class="metric-card-note">本月账单利息合计</span>
        </article>
      </section>

      <section class="analytics-grid">
        <article class="surface-card panel-card">
          <div class="panel-head">
            <div>
              <h2>还款趋势</h2>
              <p>支持折线图与柱状图切换，筛选平台和时间范围后立即刷新。</p>
            </div>
            <div class="toolbar-actions">
              <button
                :class="['theme-btn', chartType === 'line' ? 'theme-btn-primary' : 'theme-btn-outline']"
                @click="changeChartType('line')"
              >
                折线图
              </button>
              <button
                :class="['theme-btn', chartType === 'bar' ? 'theme-btn-primary' : 'theme-btn-outline']"
                @click="changeChartType('bar')"
              >
                柱状图
              </button>
            </div>
          </div>

          <div class="trend-summary-grid">
            <div class="trend-summary-card">
              <span>总额</span>
              <strong>¥{{ Number(trendSummary.total).toFixed(2) }}</strong>
            </div>
            <div class="trend-summary-card">
              <span>日均</span>
              <strong>¥{{ Number(trendSummary.avg).toFixed(2) }}</strong>
            </div>
            <div class="trend-summary-card">
              <span>最大值</span>
              <strong>¥{{ Number(trendSummary.max).toFixed(2) }}</strong>
            </div>
            <div class="trend-summary-card">
              <span>最小值</span>
              <strong>¥{{ Number(trendSummary.min).toFixed(2) }}</strong>
            </div>
          </div>

          <div ref="trendChartRef" class="chart-container analytics-chart"></div>
        </article>

        <article class="surface-card panel-card">
          <div class="panel-head">
            <div>
              <h2>平台借款分布</h2>
              <p>默认展示全部平台，选择单个平台后会聚焦展示该平台的总借款规模。</p>
            </div>
          </div>
          <div ref="platformPieRef" class="chart-container analytics-chart"></div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { billAPI, debtPlatformAPI, repaymentAPI } from '@/services/api'
import { platformPieColors } from '@/services/chartPalette'
import AppLayout from '@/components/Layout/AppLayout.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import Dropdown from '@/components/ui/Dropdown.vue'

const loading = ref(false)
const monthlyStats = ref({})
const platformStats = ref([])
const platforms = ref([])
const trendSummary = ref({ total: 0, avg: 0, max: 0, min: 0 })
const trendSeries = ref({ dates: [], series: [] })

const statsFilters = reactive({
  month: dayjs().format('YYYY-MM')
})

const rangeMode = ref('last30')
const selectedPlatformId = ref('')
const chartType = ref('line')
const customRange = reactive({
  start: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
  end: dayjs().format('YYYY-MM-DD')
})

const trendChartRef = ref(null)
const platformPieRef = ref(null)

let pieChartLib = null
let trendChartLib = null
let trendChartInstance = null
let platformPieInstance = null

const platformOptions = computed(() => platforms.value.map((item) => ({ value: item.id, label: item.name })))
const platformSelectOptions = computed(() => [
  { value: '', label: '全部平台' },
  ...platformOptions.value
])

const ensureTrendChartLibrary = async () => {
  if (!trendChartLib) {
    const module = await import('@/services/echarts-trend')
    trendChartLib = module.default || module.echarts
  }
  return trendChartLib
}

const ensurePieChartLibrary = async () => {
  if (!pieChartLib) {
    const module = await import('@/services/echarts-pie')
    pieChartLib = module.default || module.echarts
  }
  return pieChartLib
}

const setRangeMode = (mode) => {
  rangeMode.value = mode
  if (mode === 'custom' && (!customRange.start || !customRange.end)) {
    customRange.start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
    customRange.end = dayjs().format('YYYY-MM-DD')
  }
}

const validateStatsFilters = () => {
  if (rangeMode.value !== 'custom') {
    return true
  }

  if (!customRange.start || !customRange.end) {
    window.$message?.warning('请同时选择开始日期和结束日期')
    return false
  }

  return true
}

const getSelectedRange = () => {
  if (rangeMode.value === 'custom' && customRange.start && customRange.end) {
    const start = dayjs(customRange.start)
    const end = dayjs(customRange.end)

    if (start.isValid() && end.isValid() && start.isAfter(end)) {
      return { start: customRange.end, end: customRange.start }
    }

    return { start: customRange.start, end: customRange.end }
  }

  return {
    start: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD')
  }
}

const buildDateArray = (start, end) => {
  const dates = []
  let cursor = dayjs(start)
  const last = dayjs(end)
  while (cursor.isBefore(last) || cursor.isSame(last, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }
  return dates
}

const mapRowsToAmounts = (rows, dates) => {
  const amountsByDate = new Map()
  rows.forEach((row) => {
    amountsByDate.set(dayjs(row.date).format('YYYY-MM-DD'), Number(row.total_amount || 0))
  })
  return dates.map((date) => amountsByDate.get(date) || 0)
}

const updateSummary = (amounts) => {
  const total = amounts.reduce((sum, value) => sum + (value || 0), 0)
  const max = amounts.reduce((memo, value) => (value > memo ? value : memo), 0)
  const min = amounts.length ? amounts.reduce((memo, value) => (value < memo ? value : memo), amounts[0]) : 0
  const avg = amounts.length ? total / amounts.length : 0
  trendSummary.value = { total, avg, max, min }
}

const loadRepaymentTrend = async () => {
  const { start, end } = getSelectedRange()
  const dates = buildDateArray(start, end)
  const rows = selectedPlatformId.value
    ? await repaymentAPI.getDailyTrend(start, end, selectedPlatformId.value)
    : await repaymentAPI.getDailyTrend(start, end)

  const amounts = mapRowsToAmounts(rows, dates)
  const name =
    platforms.value.find((item) => item.id === selectedPlatformId.value)?.name || '全部平台'

  trendSeries.value = {
    dates,
    series: [
      {
        name,
        type: chartType.value,
        smooth: chartType.value === 'line',
        data: amounts,
        areaStyle: chartType.value === 'line' ? { opacity: 0.12 } : undefined,
        lineStyle: { width: 3 },
        itemStyle: { color: '#16a34a' },
        barMaxWidth: 40
      }
    ]
  }

  updateSummary(amounts)
}

const renderTrendChart = async () => {
  if (!trendChartRef.value) return

  const echarts = await ensureTrendChartLibrary()
  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }

  trendChartInstance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#dfe9e2',
        borderWidth: 1,
        textStyle: { color: '#173025', fontSize: 13 },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 12px 26px rgba(21,45,33,0.10); border-radius: 16px;'
      },
      grid: { left: 54, right: 18, top: 20, bottom: 48 },
      xAxis: {
        type: 'category',
        data: trendSeries.value.dates,
        axisLabel: { rotate: 45, fontSize: 12, color: '#6c8578' },
        axisLine: { lineStyle: { color: '#dfe9e2' } }
      },
      yAxis: {
        type: 'value',
        name: '金额 (¥)',
        axisLabel: { color: '#6c8578', formatter: (value) => `¥${value}` },
        axisLine: { lineStyle: { color: '#dfe9e2' } },
        splitLine: { lineStyle: { color: '#edf5ee', type: 'dashed' } }
      },
      series: trendSeries.value.series
    },
    true
  )
}

const renderPlatformPie = async () => {
  if (!platformPieRef.value) return

  const echarts = await ensurePieChartLibrary()
  if (!platformPieInstance) {
    platformPieInstance = echarts.init(platformPieRef.value)
  }

  const filteredStats = selectedPlatformId.value
    ? platformStats.value.filter((item) => item.id === selectedPlatformId.value)
    : platformStats.value

  const data = filteredStats
    .map((item) => ({
      name: item.name,
      value: Number(item.total_unpaid || 0) + Number(item.total_paid || 0)
    }))
    .filter((item) => item.value > 0)

  platformPieInstance.setOption(
    {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#dfe9e2',
        borderWidth: 1,
        textStyle: { color: '#173025', fontSize: 13 },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 12px 26px rgba(21,45,33,0.10); border-radius: 16px;'
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        left: 'center',
        textStyle: { color: '#6c8578', fontSize: 12 },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        padding: [18, 0, 0, 0]
      },
      color: platformPieColors,
      series: [
        {
          type: 'pie',
          radius: ['35%', '64%'],
          center: ['50%', '43%'],
          itemStyle: {
            borderRadius: 10,
            borderColor: '#ffffff',
            borderWidth: 3
          },
          label: {
            show: true,
            fontSize: 12,
            formatter: (params) => `${params.name}\n¥${Number(params.value).toFixed(2)}`
          },
          data
        }
      ]
    },
    true
  )
}

const renderCharts = async () => {
  await nextTick()
  await Promise.all([renderTrendChart(), renderPlatformPie()])
}

const changeChartType = async (type) => {
  if (chartType.value === type) return
  chartType.value = type
  await loadStats()
}

const applyStatsFilters = async () => {
  if (!validateStatsFilters()) {
    return
  }

  await loadStats()
}

const resetStatsFilters = async () => {
  statsFilters.month = dayjs().format('YYYY-MM')
  rangeMode.value = 'last30'
  selectedPlatformId.value = ''
  customRange.start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
  customRange.end = dayjs().format('YYYY-MM-DD')
  await loadStats()
}

const loadStats = async () => {
  try {
    if (!validateStatsFilters()) {
      return
    }

    loading.value = true

    const [monthlyResponse, platformResponse, platformsResponse] = await Promise.all([
      billAPI.getMonthlyStats(statsFilters.month),
      debtPlatformAPI.getStats(),
      debtPlatformAPI.getAll()
    ])

    monthlyStats.value = monthlyResponse || {}
    platformStats.value = platformResponse || []
    platforms.value = platformsResponse || []

    await loadRepaymentTrend()
    await renderCharts()
  } catch (error) {
    console.error('加载统计数据失败:', error)
    window.$message?.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  trendChartInstance?.resize()
  platformPieInstance?.resize()
}

onMounted(async () => {
  await loadStats()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChartInstance?.dispose()
  platformPieInstance?.dispose()
  trendChartInstance = null
  platformPieInstance = null
})
</script>

<style scoped>
.custom-range-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  padding: 0 20px 20px;
  overflow-x: auto;
}

.range-caption {
  color: var(--text-muted);
  font-size: 0.92rem;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.95fr;
  gap: 18px;
}

.panel-card {
  padding: 22px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.15rem;
  font-weight: 800;
}

.panel-head p {
  margin: 8px 0 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.trend-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.trend-summary-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(247, 251, 248, 0.84);
  border: 1px solid var(--border-soft);
}

.trend-summary-card span {
  display: block;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.trend-summary-card strong {
  display: block;
  margin-top: 8px;
  color: var(--text-strong);
  font-size: 1.06rem;
}

.analytics-chart {
  min-height: 468px;
}

.filter-toolbar-group {
  min-width: 0;
  flex: 1;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 2px;
}

.filter-item {
  min-width: 168px;
  flex: 0 0 168px;
}

.filter-segment-item {
  flex: 0 0 auto;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1180px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .trend-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .trend-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
