<template>
  <div class="statistics">
    <a-space direction="vertical" size="middle" style="width: 100%">
      <a-card :bordered="false" class="filters-card">
        <a-space wrap>
          <a-date-picker
            v-model:value="statsFilters.month"
            placeholder="选择月份"
            format="YYYY-MM"
            picker="month"
          />
          <a-radio-group v-model:value="rangeMode">
            <a-radio-button value="last30">最近30天</a-radio-button>
            <a-radio-button value="custom">自定义范围</a-radio-button>
          </a-radio-group>
          <a-range-picker
            v-if="rangeMode === 'custom'"
            v-model:value="customRange"
            format="YYYY-MM-DD"
          />
          <a-select
            v-model:value="selectedPlatformIds"
            mode="multiple"
            :options="platformOptions"
            style="min-width: 260px"
            placeholder="筛选平台（可多选）"
            allow-clear
          />
          <a-radio-group v-model:value="chartType">
            <a-radio-button value="line">折线</a-radio-button>
            <a-radio-button value="bar">柱状</a-radio-button>
          </a-radio-group>
          <a-button type="primary" :loading="loading" @click="loadStats">刷新</a-button>
        </a-space>
      </a-card>

      <a-spin :spinning="loading">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-card size="small">
              <a-statistic title="总账单数" :value="Number(monthlyStats.total_bills || 0)" />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-card size="small">
              <a-statistic title="总金额" :value="Number(monthlyStats.total_amount || 0)" :precision="2" prefix="¥" />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-card size="small">
              <a-statistic title="已还款金额" :value="Number(monthlyStats.paid_amount || 0)" :precision="2" prefix="¥" />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-card size="small">
              <a-statistic title="未还款金额" :value="Number(monthlyStats.unpaid_amount || 0)" :precision="2" prefix="¥" />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-card size="small">
              <a-statistic title="总利息" :value="Number(monthlyStats.total_interest || 0)" :precision="2" prefix="¥" />
            </a-card>
          </a-col>
        </a-row>
      </a-spin>

      <a-card :bordered="false" class="charts-card">
        <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
          <a-tab-pane key="trend" tab="还款趋势">
            <a-row :gutter="[16, 16]" style="margin-bottom: 12px">
              <a-col :xs="24" :sm="12" :md="6">
                <a-statistic title="总额" :value="trendSummary.total" :precision="2" prefix="¥" />
              </a-col>
              <a-col :xs="24" :sm="12" :md="6">
                <a-statistic title="日均" :value="trendSummary.avg" :precision="2" prefix="¥" />
              </a-col>
              <a-col :xs="24" :sm="12" :md="6">
                <a-statistic title="最大值" :value="trendSummary.max" :precision="2" prefix="¥" />
              </a-col>
              <a-col :xs="24" :sm="12" :md="6">
                <a-statistic title="最小值" :value="trendSummary.min" :precision="2" prefix="¥" />
              </a-col>
            </a-row>

            <a-spin :spinning="loading">
              <div class="chart-shell">
                <div ref="trendChartRef" class="chart-canvas"></div>
                <div v-if="trendEmpty && !loading" class="chart-overlay">
                  <a-empty description="暂无趋势数据" />
                </div>
              </div>
            </a-spin>
          </a-tab-pane>
          <a-tab-pane key="platform" tab="平台分布">
            <a-spin :spinning="loading">
              <div class="chart-shell">
                <div ref="platformPieRef" class="chart-canvas"></div>
                <div v-if="pieEmpty && !loading" class="chart-overlay">
                  <a-empty description="暂无平台借款数据" />
                </div>
              </div>
            </a-spin>
          </a-tab-pane>
        </a-tabs>
      </a-card>

      <a-card title="当日还款记录" size="small">
        <div v-if="selectedDate">
          <a-alert type="info" :message="`选中日期：${selectedDate}`" show-icon style="margin-bottom: 8px" />
          <a-table :columns="recordColumns" :data-source="dailyRecords" row-key="id" size="small" :pagination="false" />
        </div>
        <a-empty v-else description="在趋势图上点击某一天查看当日记录" />
      </a-card>
    </a-space>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { billAPI, debtPlatformAPI, repaymentAPI } from '@/services/api';
import dayjs from 'dayjs';
import * as echarts from 'echarts';
import { formatDate } from '@/services/format';
import { useRoute, useRouter } from 'vue-router';

const loading = ref(false);
const route = useRoute();
const router = useRouter();
const stateKey = 'repay-record:statistics-state';
const activeTab = ref('trend');
const monthlyStats = ref({});
const platformStats = ref([]);
const trendChartRef = ref(null);
let trendChartInstance = null;
const trendSeries = ref({ dates: [], series: [], nameToPid: {} });
const trendSummary = ref({ total: 0, avg: 0, max: 0, min: 0 });
const platformPieRef = ref(null);
let platformPieInstance = null;

// 趋势筛选相关
const rangeMode = ref('last30'); // 'last30' | 'custom'
const customRange = ref([dayjs().subtract(29, 'day'), dayjs()]);
const selectedPlatformIds = ref([]); // 多选平台
const chartType = ref('line'); // 'line' | 'bar'
const platforms = ref([]);
const platformOptions = computed(() => platforms.value.map(p => ({ value: p.id, label: p.name })));
const monthlyPlatformSums = ref([]);

const statsFilters = reactive({
  month: dayjs()
});

const repaymentRate = computed(() => {
  const { total_amount, paid_amount } = monthlyStats.value;
  if (!total_amount || total_amount === 0) return 0;
  return ((paid_amount / total_amount) * 100).toFixed(2);
});

const calculateProgress = (item) => {
  const total = parseFloat(item.total_unpaid) + parseFloat(item.total_paid);
  if (total === 0) return 0;
  return ((parseFloat(item.total_paid) / total) * 100).toFixed(2);
};

const loadStats = async () => {
  try {
    loading.value = true;
    
    // 加载月度统计
    const month = dayjs(statsFilters.month).format('YYYY-MM');
    const monthlyResponse = await billAPI.getMonthlyStats(month);
    monthlyStats.value = monthlyResponse;
    monthlyPlatformSums.value = await billAPI.getMonthlyPlatformSums(month);
    
    // 加载平台统计与平台列表
    const platformResponse = await debtPlatformAPI.getStats();
    platformStats.value = platformResponse;
    platforms.value = await debtPlatformAPI.getAll();
    
    await loadRepaymentTrend();
    await ensureActiveChart();
    
  } catch (error) {
    console.error('加载统计数据失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  initFromQuery();
  loadStats();
});

onBeforeUnmount(() => {
  if (trendChartInstance) {
    trendChartInstance.dispose();
    trendChartInstance = null;
  }
  if (platformPieInstance) {
    platformPieInstance.dispose();
    platformPieInstance = null;
  }
  window.removeEventListener('resize', handleResize);
});

watch(() => statsFilters.month, async () => {
  syncQuery();
  await loadStats();
});

watch(platformStats, () => {
  renderPlatformPie();
});

watch([rangeMode, customRange, selectedPlatformIds, chartType], () => {
  syncQuery();
  loadRepaymentTrend();
});

watch(loading, async (value) => {
  if (!value) {
    await ensureActiveChart();
    renderTrendChart();
    renderPlatformPie();
  }
});

const handleTabChange = async (key) => {
  activeTab.value = key;
  await ensureActiveChart();
  if (activeTab.value === 'trend') {
    renderTrendChart();
  } else {
    renderPlatformPie();
  }
};

const isVisibleEl = (el) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const ensureActiveChart = async () => {
  if (activeTab.value === 'trend') {
    await ensureTrendChart();
  } else {
    await ensurePlatformPie();
  }
};

const ensureTrendChart = async () => {
  await nextTick();
  if (!trendChartInstance && trendChartRef.value && isVisibleEl(trendChartRef.value)) {
    trendChartInstance = echarts.init(trendChartRef.value);
    window.addEventListener('resize', handleResize);
    trendChartInstance.on('click', handleTrendClick);
  }
  if (trendChartInstance) trendChartInstance.resize();
};

const ensurePlatformPie = async () => {
  await nextTick();
  if (!platformPieInstance && platformPieRef.value && isVisibleEl(platformPieRef.value)) {
    platformPieInstance = echarts.init(platformPieRef.value);
  }
  if (platformPieInstance) platformPieInstance.resize();
};

const handleResize = () => {
  if (trendChartInstance) trendChartInstance.resize();
  if (platformPieInstance) platformPieInstance.resize();
};

const loadRepaymentTrend = async () => {
  try {
    const { start, end } = getSelectedRange();
    const dates = buildDateArray(start, end);
    const nameToPid = {};

    let series = [];
    if (!selectedPlatformIds.value || selectedPlatformIds.value.length === 0) {
      const rows = await repaymentAPI.getDailyTrend(start, end);
      const amounts = mapRowsToAmounts(rows, dates);
      series = [{ name: '全部平台', type: chartType.value, smooth: true, data: amounts, areaStyle: chartType.value === 'line' ? { opacity: 0.15 } : undefined }];
      updateSummary(amounts);
    } else {
      const allAmountsPerPlatform = [];
      for (const pid of selectedPlatformIds.value) {
        const rows = await repaymentAPI.getDailyTrend(start, end, pid);
        const amounts = mapRowsToAmounts(rows, dates);
        const name = platforms.value.find(p => p.id === pid)?.name || `平台${pid}`;
        nameToPid[name] = pid;
        allAmountsPerPlatform.push(amounts);
        series.push({ name, type: chartType.value, smooth: chartType.value === 'line', data: amounts, areaStyle: chartType.value === 'line' ? { opacity: 0.12 } : undefined });
      }
      const aggregated = aggregateAmounts(allAmountsPerPlatform, dates.length);
      updateSummary(aggregated);
    }
    trendSeries.value = { dates, series, nameToPid };
    renderTrendChart();
  } catch (error) {
    console.error('加载还款趋势失败:', error);
  }
};

const syncQuery = () => {
  const query = {};
  if (statsFilters.month) query.month = dayjs(statsFilters.month).format('YYYY-MM');
  if (rangeMode.value) query.range_mode = rangeMode.value;
  if (rangeMode.value === 'custom' && customRange.value && customRange.value.length === 2) {
    query.start_date = dayjs(customRange.value[0]).format('YYYY-MM-DD');
    query.end_date = dayjs(customRange.value[1]).format('YYYY-MM-DD');
  }
  if (selectedPlatformIds.value && selectedPlatformIds.value.length > 0) {
    query.platform_ids = selectedPlatformIds.value.join(',');
  }
  if (chartType.value) query.chart_type = chartType.value;
  router.replace({ query });
  saveState();
};

const initFromQuery = () => {
  const { month, range_mode, start_date, end_date, platform_ids, chart_type } = route.query;
  const hasQuery = [month, range_mode, start_date, end_date, platform_ids, chart_type].some(v => v !== undefined);
  if (!hasQuery) {
    restoreState();
    return;
  }
  if (month) statsFilters.month = dayjs(month);
  if (range_mode === 'custom' || range_mode === 'last30') rangeMode.value = range_mode;
  if (start_date && end_date) customRange.value = [dayjs(start_date), dayjs(end_date)];
  if (platform_ids) {
    const ids = String(platform_ids).split(',').map(id => parseInt(id, 10)).filter(id => Number.isInteger(id));
    selectedPlatformIds.value = ids;
  }
  if (chart_type === 'line' || chart_type === 'bar') chartType.value = chart_type;
};

const saveState = () => {
  const payload = {
    month: statsFilters.month ? dayjs(statsFilters.month).format('YYYY-MM') : null,
    rangeMode: rangeMode.value,
    customRange: customRange.value && customRange.value.length === 2
      ? [
        dayjs(customRange.value[0]).format('YYYY-MM-DD'),
        dayjs(customRange.value[1]).format('YYYY-MM-DD')
      ]
      : null,
    platformIds: selectedPlatformIds.value,
    chartType: chartType.value
  };
  try {
    localStorage.setItem(stateKey, JSON.stringify(payload));
  } catch (_) {}
};

const restoreState = () => {
  try {
    const raw = localStorage.getItem(stateKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed?.month) statsFilters.month = dayjs(parsed.month);
    if (parsed?.rangeMode === 'custom' || parsed?.rangeMode === 'last30') rangeMode.value = parsed.rangeMode;
    if (parsed?.customRange && parsed.customRange.length === 2) {
      customRange.value = [dayjs(parsed.customRange[0]), dayjs(parsed.customRange[1])];
    }
    if (Array.isArray(parsed?.platformIds)) selectedPlatformIds.value = parsed.platformIds;
    if (parsed?.chartType === 'line' || parsed?.chartType === 'bar') chartType.value = parsed.chartType;
    return true;
  } catch (_) {
    return false;
  }
};

const renderTrendChart = () => {
  if (!trendChartInstance) return;
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { top: 4 },
    xAxis: { type: 'category', data: trendSeries.value.dates },
    yAxis: { type: 'value', name: '金额(¥)' },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    series: trendSeries.value.series
  };
  trendChartInstance.setOption(option);
};

function getSelectedRange() {
  if (rangeMode.value === 'custom' && customRange.value && customRange.value.length === 2) {
    return {
      start: dayjs(customRange.value[0]).format('YYYY-MM-DD'),
      end: dayjs(customRange.value[1]).format('YYYY-MM-DD')
    };
  } else {
    const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
    const end = dayjs().format('YYYY-MM-DD');
    return { start, end };
  }
}

function buildDateArray(start, end) {
  const dates = [];
  let cursor = dayjs(start);
  const last = dayjs(end);
  while (cursor.isBefore(last) || cursor.isSame(last, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }
  return dates;
}

function mapRowsToAmounts(rows, dates) {
  const map = new Map();
  rows.forEach(r => map.set(dayjs(r.date).format('YYYY-MM-DD'), parseFloat(r.total_amount)));
  return dates.map(d => map.get(d) || 0);
}

function aggregateAmounts(listOfAmounts, length) {
  const result = new Array(length).fill(0);
  for (const arr of listOfAmounts) {
    for (let i = 0; i < length; i++) {
      result[i] += arr[i] || 0;
    }
  }
  return result;
}

function updateSummary(amounts) {
  const total = amounts.reduce((s, v) => s + (v || 0), 0);
  const max = amounts.reduce((m, v) => v > m ? v : m, 0);
  const min = amounts.reduce((m, v) => v < m ? v : m, amounts.length ? amounts[0] : 0);
  const avg = amounts.length ? total / amounts.length : 0;
  trendSummary.value = { total, avg, max, min };
}

const selectedDate = ref('');
const dailyRecords = ref([]);
const recordColumns = [
  { title: '平台', dataIndex: 'platform_name', key: 'platform_name' },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 100, customRender: ({ text }) => `¥${parseFloat(text || 0).toFixed(2)}` },
  { title: '还款日期', dataIndex: 'repayment_date', key: 'repayment_date', width: 120, customRender: ({ text }) => formatDate(text) },
  { title: '备注', dataIndex: 'notes', key: 'notes' }
];

async function handleTrendClick(params) {
  try {
    const date = params.name; // x轴日期
    selectedDate.value = date;
    const pid = trendSeries.value.nameToPid[params.seriesName] || undefined;
    const rows = await repaymentAPI.getByDateRange(date, date, pid);
    dailyRecords.value = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));
  } catch (e) {
    // 忽略错误
  }
}

// 平台负债饼图
const initPlatformPie = () => {
  if (platformPieRef.value) {
    platformPieInstance = echarts.init(platformPieRef.value);
    // 初始化后立即尝试渲染当前数据（若已有）
    renderPlatformPie();
  }
};

const renderPlatformPie = () => {
  if (!platformPieInstance) return;
  const stats = monthlyPlatformSums.value || [];
  const total = stats.reduce((s, it) => s + parseFloat(it.total_amount || 0), 0);
  const data = stats.map(item => ({
    name: item.platform_name,
    value: parseFloat(item.total_amount || 0)
  })).filter(d => d.value > 0);
  const option = {
    title: { text: `当月平台借款分布（总计 ¥${total.toFixed(2)}）`, left: 'center' },
    tooltip: { trigger: 'item', formatter: ({ name, value, percent }) => `${name}: ¥${Number(value).toFixed(2)} (${percent}%)` },
    legend: { type: 'scroll', bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          formatter: (params) => `${params.name}\n¥${Number(params.value).toFixed(2)}`
        },
        data
      }
    ]
  };
  platformPieInstance.setOption(option);
};

const pieEmpty = computed(() => {
  if (loading.value) return false;
  const stats = monthlyPlatformSums.value || [];
  if (stats.length === 0) return true;
  return stats.every(item => parseFloat(item.total_amount || 0) <= 0);
});

const trendEmpty = computed(() => {
  if (loading.value) return false;
  const series = trendSeries.value.series || [];
  if (series.length === 0) return true;
  return series.every(s => Array.isArray(s.data) && s.data.every(v => Number(v) === 0));
});

</script>

<style scoped>
.statistics {
  padding: 20px;
}

.filters-card {
  background: #fff;
}

.charts-card {
  background: #fff;
}

.chart-shell {
  height: 360px;
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.chart-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
}
</style>
