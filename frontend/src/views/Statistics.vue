<template>
  <AppLayout>
    <div style="padding: 0;">
      <!-- 页面标题 -->
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #141414; margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">📈</span>
          数据统计
        </h1>
        <p style="font-size: 16px; color: #8c8c8c; margin: 0;">多维度分析您的借款和还款数据，可视化趋势图表</p>
      </div>

      <!-- 筛选栏 -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #f0f0f0;">
        <div style="display: flex; gap: 12px;">
          <DatePicker v-model="statsFilters.month" type="month" style="width: 140px;" />
          
          <div style="display: flex; align-items: center; gap: 8px; background: #f5f5f5; padding: 4px; border-radius: 8px;">
            <button :class="['theme-btn', rangeMode === 'last30' ? 'theme-btn-primary' : 'theme-btn-outline']" style="padding: 8px 14px; font-size: 14px;" @click="rangeMode = 'last30'">最近 30 天</button>
            <button :class="['theme-btn', rangeMode === 'custom' ? 'theme-btn-primary' : 'theme-btn-outline']" style="padding: 8px 14px; font-size: 14px;" @click="rangeMode = 'custom'">自定义范围</button>
          </div>
          
          <Dropdown v-model="selectedPlatformId" :options="platformSelectOptions" placeholder="全部平台" style="width: 140px;" />
        </div>
        <button @click="loadStats" class="theme-btn theme-btn-primary" style="padding: 8px 14px; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :style="{ animation: loading ? 'spin 1s linear infinite' : '' }">
            <polyline points="23,4 23,10 17,10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          刷新
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span class="stat-label">总账单数</span>
            <div class="stat-icon stat-icon-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #141414;">{{ Number(monthlyStats.total_bills || 0) }}</div>
        </div>

        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span class="stat-label">总金额</span>
            <div class="stat-icon stat-icon-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #1677ff;">¥{{ Number(monthlyStats.total_amount || 0).toFixed(2) }}</div>
        </div>

        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span class="stat-label">已还款</span>
            <div class="stat-icon stat-icon-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #52c41a;">¥{{ Number(monthlyStats.paid_amount || 0).toFixed(2) }}</div>
        </div>

        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span class="stat-label">未还款</span>
            <div class="stat-icon stat-icon-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #faad14;">¥{{ Number(monthlyStats.unpaid_amount || 0).toFixed(2) }}</div>
        </div>

        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span class="stat-label">总利息</span>
            <div class="stat-icon stat-icon-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
                <polyline points="17,6 23,6 23,12" />
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #ff4d4f;">¥{{ Number(monthlyStats.total_interest || 0).toFixed(2) }}</div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="chart-grid" style="margin-bottom: 24px;">
        <!-- 还款趋势 -->
        <div class="card">
          <h3 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
              <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
              <polyline points="17,6 23,6 23,12" />
            </svg>
            还款趋势
          </h3>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <button :class="['theme-btn', chartType === 'line' ? 'theme-btn-primary' : 'theme-btn-outline']" style="padding: 6px 12px; font-size: 13px;" @click="changeChartType('line')">折线图</button>
            <button :class="['theme-btn', chartType === 'bar' ? 'theme-btn-primary' : 'theme-btn-outline']" style="padding: 6px 12px; font-size: 13px;" @click="changeChartType('bar')">柱状图</button>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;">
            <div style="text-align: center; padding: 12px; background: #fafafa; border-radius: 8px;">
              <div style="font-size: 13px; color: #8c8c8c; margin-bottom: 4px;">总额</div>
              <div style="font-size: 16px; font-weight: 600; color: #1677ff;">¥{{ Number(trendSummary.total).toFixed(2) }}</div>
            </div>
            <div style="text-align: center; padding: 12px; background: #fafafa; border-radius: 8px;">
              <div style="font-size: 13px; color: #8c8c8c; margin-bottom: 4px;">日均</div>
              <div style="font-size: 16px; font-weight: 600; color: #595959;">¥{{ Number(trendSummary.avg).toFixed(2) }}</div>
            </div>
            <div style="text-align: center; padding: 12px; background: #fafafa; border-radius: 8px;">
              <div style="font-size: 13px; color: #8c8c8c; margin-bottom: 4px;">最大值</div>
              <div style="font-size: 16px; font-weight: 600; color: #52c41a;">¥{{ Number(trendSummary.max).toFixed(2) }}</div>
            </div>
            <div style="text-align: center; padding: 12px; background: #fafafa; border-radius: 8px;">
              <div style="font-size: 13px; color: #8c8c8c; margin-bottom: 4px;">最小值</div>
              <div style="font-size: 16px; font-weight: 600; color: #faad14;">¥{{ Number(trendSummary.min).toFixed(2) }}</div>
            </div>
          </div>

          <div ref="trendChartRef" class="chart-container"></div>
        </div>

        <!-- 平台分布 -->
        <div class="card">
          <h3 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            平台借款分布
          </h3>
          <div ref="platformPieRef" class="chart-container"></div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { billAPI, debtPlatformAPI, repaymentAPI } from '@/services/api'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import AppLayout from '@/components/Layout/AppLayout.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import DatePicker from '@/components/ui/DatePicker.vue'

const loading = ref(false)
const monthlyStats = ref({})
const platformStats = ref([])
const trendChartRef = ref(null)
let trendChartInstance = null
const platformPieRef = ref(null)
let platformPieInstance = null

const statsFilters = reactive({
  month: dayjs().format('YYYY-MM'),
})

const rangeMode = ref('last30')
const selectedPlatformId = ref('')
const chartType = ref('line')
const trendSummary = ref({ total: 0, avg: 0, max: 0, min: 0 })
const trendSeries = ref({ dates: [], series: [] })

const platforms = ref([])

const platformOptions = computed(() => 
  platforms.value.map(p => ({ value: p.id, label: p.name }))
)

const platformSelectOptions = computed(() => [
  { value: '', label: '全部平台' },
  ...platformOptions.value
])

const changeChartType = async (type) => {
  if (chartType.value === type) return
  chartType.value = type
  await nextTick()
  await loadRepaymentTrend()
  await nextTick()
  renderTrendChart()
}

const loadStats = async () => {
  try {
    loading.value = true

    const month = statsFilters.month
    const monthlyResponse = await billAPI.getMonthlyStats(month)
    monthlyStats.value = monthlyResponse

    const platformResponse = await debtPlatformAPI.getStats()
    platformStats.value = platformResponse
    platforms.value = await debtPlatformAPI.getAll()

    await loadRepaymentTrend()
    await nextTick()
    renderCharts()

  } catch (error) {
    console.error('加载统计数据失败:', error)
    window.$message?.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadRepaymentTrend = async () => {
  try {
    const { start, end } = getSelectedRange()
    const dates = buildDateArray(start, end)

    let series = []
    if (!selectedPlatformId.value) {
      const rows = await repaymentAPI.getDailyTrend(start, end)
      const amounts = mapRowsToAmounts(rows, dates)
      series = [{ 
        name: '全部平台', 
        type: chartType.value, 
        smooth: chartType.value === 'line',
        data: amounts,
        areaStyle: chartType.value === 'line' ? { opacity: 0.15 } : undefined,
        lineStyle: { width: 3 },
        itemStyle: { color: '#1677ff' },
        barMaxWidth: 40
      }]
      updateSummary(amounts)
    } else {
      const rows = await repaymentAPI.getDailyTrend(start, end, selectedPlatformId.value)
      const amounts = mapRowsToAmounts(rows, dates)
      const name = platforms.value.find(p => p.id === selectedPlatformId.value)?.name || '未知平台'
      series = [{ 
        name, 
        type: chartType.value, 
        smooth: chartType.value === 'line',
        data: amounts,
        areaStyle: chartType.value === 'line' ? { opacity: 0.12 } : undefined,
        lineStyle: { width: 3 },
        itemStyle: { color: '#1677ff' },
        barMaxWidth: 40
      }]
      updateSummary(amounts)
    }
    trendSeries.value = { dates, series }
  } catch (error) {
    console.error('加载还款趋势失败:', error)
  }
}

const renderCharts = () => {
  renderTrendChart()
  renderPlatformPie()
}

const renderTrendChart = () => {
  if (!trendChartRef.value) return
  
  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }
  
  const option = {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { color: '#141414', fontSize: 13 },
      padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
    },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: { 
      type: 'category', 
      data: trendSeries.value.dates,
      axisLabel: { rotate: 45, fontSize: 12, color: '#8c8c8c' },
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    yAxis: { 
      type: 'value', 
      name: '金额 (¥)',
      axisLabel: { fontSize: 12, color: '#8c8c8c', formatter: (value) => '¥' + value },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
    },
    series: trendSeries.value.series
  }
  trendChartInstance.setOption(option, true)
}

const renderPlatformPie = () => {
  if (!platformPieRef.value) return
  if (!platformPieInstance) {
    platformPieInstance = echarts.init(platformPieRef.value)
  }

  const stats = platformStats.value || []
  const data = stats.map(item => ({
    name: item.name,
    value: parseFloat(item.total_unpaid || 0) + parseFloat(item.total_paid || 0)
  })).filter(d => d.value > 0)

  const option = {
    tooltip: { 
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { color: '#141414', fontSize: 13 },
      padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
    },
    legend: { 
      type: 'scroll', 
      bottom: 10,
      left: 'center',
      textStyle: { color: '#595959', fontSize: 12 },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10
    },
    color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#f5222d'],
    series: [{
      type: 'pie',
      radius: ['40%', '75%'],
      center: ['50%', '50%'],
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        fontSize: 12,
        formatter: (params) => `{name|${params.name}}\n{value|¥${Number(params.value).toFixed(2)}}`,
        rich: {
          name: { fontSize: 12, color: '#595959', lineHeight: 18 },
          value: { fontSize: 13, color: '#1677ff', lineHeight: 20, fontWeight: 600 }
        }
      },
      data
    }]
  }
  platformPieInstance.setOption(option)
}

const getSelectedRange = () => {
  const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
  const end = dayjs().format('YYYY-MM-DD')
  return { start, end }
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
  const map = new Map()
  rows.forEach(r => map.set(dayjs(r.date).format('YYYY-MM-DD'), parseFloat(r.total_amount)))
  return dates.map(d => map.get(d) || 0)
}

const updateSummary = (amounts) => {
  const total = amounts.reduce((s, v) => s + (v || 0), 0)
  const max = amounts.reduce((m, v) => v > m ? v : m, 0)
  const min = amounts.length ? amounts.reduce((m, v) => v < m ? v : m, amounts[0]) : 0
  const avg = amounts.length ? total / amounts.length : 0
  trendSummary.value = { total, avg, max, min }
}

watch(() => statsFilters.month, () => {
  loadStats()
})

watch([rangeMode, selectedPlatformId], () => {
  loadStats()
})

onMounted(() => {
  loadStats()
  
  window.addEventListener('resize', () => {
    trendChartInstance?.resize()
    platformPieInstance?.resize()
  })
})
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-primary { background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%); color: #1677ff; }
.stat-icon-success { background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%); color: #52c41a; }
.stat-icon-warning { background: linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%); color: #faad14; }
.stat-icon-error { background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%); color: #ff4d4f; }

.stat-value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #141414;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
}

.chart-container {
  width: 100%;
  height: 320px;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.theme-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.theme-btn-primary {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(22, 119, 255, 0.3);
}

.theme-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
}

.theme-btn-outline {
  background: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.theme-btn-outline:hover {
  background: #e6f4ff;
  border-color: #1677ff;
  color: #1677ff;
}

@media (max-width: 1400px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
