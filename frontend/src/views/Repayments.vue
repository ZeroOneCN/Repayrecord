<template>
  <AppLayout>
    <div class="page-shell">
      <section class="page-header">
        <div class="page-header-main">
          <span class="page-icon-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 3V21" />
              <path d="M17 7H10.5A3.5 3.5 0 0 0 10.5 14H13.5A3.5 3.5 0 0 1 13.5 21H7" />
            </svg>
          </span>
          <div>
            <p class="page-kicker">Repayments</p>
            <h1 class="page-title">还款记录</h1>
            <p class="page-description">
              记录每一笔还款流水、对应利息与备注信息。列表改为后端分页，数据量增大时也能保持更快的加载速度。
            </p>
          </div>
        </div>
      </section>

      <section class="surface-card">
        <div class="toolbar">
          <div class="toolbar-group filter-toolbar-group">
            <div class="filter-row">
              <div class="filter-item">
                <Dropdown v-model="filters.platform_id" :options="platformSelectOptions" placeholder="全部平台" />
              </div>
              <div class="filter-item">
                <DatePicker v-model="filters.start_date" type="date" placeholder="开始日期" />
              </div>
              <div class="filter-item">
                <DatePicker v-model="filters.end_date" type="date" placeholder="结束日期" />
              </div>
            </div>
          </div>
          <div class="toolbar-actions">
            <button class="theme-btn theme-btn-outline" :disabled="loading" @click="applyFilters">
              查询
            </button>
            <button class="theme-btn theme-btn-secondary" :disabled="loading" @click="resetFilters">
              重置
            </button>
            <button class="theme-btn theme-btn-primary" @click="showModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加还款记录
            </button>
          </div>
        </div>

        <div class="data-table-shell">
          <table class="data-table repayments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>平台</th>
                <th>还款金额</th>
                <th>还款利息</th>
                <th>还款日期</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody v-if="repayments.length">
              <tr v-for="item in repayments" :key="item.id">
                <td class="table-cell-muted">#{{ item.id }}</td>
                <td>
                  <div class="table-platform">
                    <span class="table-avatar">{{ item.platform_name?.charAt(0).toUpperCase() || 'P' }}</span>
                    <span class="table-platform-name">{{ item.platform_name }}</span>
                  </div>
                </td>
                <td class="table-cell-accent">¥{{ Number(item.amount || 0).toFixed(2) }}</td>
                <td class="table-cell-muted">¥{{ formatInterest(item) }}</td>
                <td>{{ formatDate(item.repayment_date) }}</td>
                <td class="table-cell-muted">{{ item.notes || '-' }}</td>
                <td>
                  <div class="table-actions">
                    <button class="theme-btn theme-btn-danger" @click="deleteRecord(item)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="7">
                  <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <p class="empty-title">暂无还款记录</p>
                    <p class="empty-description">可以先从账单页标记还款，或在这里手动补录历史流水。</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pager">
          <div class="pager-meta">
            <span>每页显示</span>
            <div class="page-size-select">
              <Dropdown v-model="pageSize" :options="pageSizeOptions" />
            </div>
            <span>共 {{ total }} 条</span>
          </div>

          <div class="pager-actions">
            <span>第</span>
            <input v-model.number="currentPageInput" class="page-number-input" type="number" min="1" :max="totalPages" />
            <span>页 / 共 {{ totalPages }} 页</span>
            <button class="theme-btn theme-btn-outline" :disabled="currentPage === 1" @click="goToFirst">首页</button>
            <button class="theme-btn theme-btn-outline" :disabled="currentPage === 1" @click="prevPage">上一页</button>
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="['theme-btn', currentPage === page ? 'theme-btn-primary' : 'theme-btn-outline']"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
            <button class="theme-btn theme-btn-outline" :disabled="currentPage === totalPages" @click="nextPage">下一页</button>
            <button class="theme-btn theme-btn-outline" :disabled="currentPage === totalPages" @click="goToLast">末页</button>
          </div>
        </div>
      </section>

      <div v-if="modalVisible" class="modal-overlay" @click="modalVisible = false">
        <div class="theme-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">添加还款记录</h3>
            <button class="modal-close" title="关闭" @click="modalVisible = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-item">
                <label class="form-label">选择账单</label>
                <Dropdown v-model="formState.bill_id" :options="billOptions" placeholder="请选择账单" @change="handleBillChange" />
              </div>

              <div class="form-row">
                <div class="form-item">
                  <label class="form-label">还款金额</label>
                  <input v-model.number="formState.amount" class="theme-input" type="number" min="0" placeholder="请输入还款金额" />
                </div>
                <div class="form-item">
                  <label class="form-label">还款利息</label>
                  <input v-model.number="formState.interest" class="theme-input" type="number" min="0" placeholder="请输入还款利息" />
                </div>
              </div>

              <div class="form-item">
                <label class="form-label">还款日期</label>
                <DatePicker v-model="formState.repayment_date" type="date" placeholder="选择还款日期" />
              </div>

              <div class="form-item">
                <label class="form-label">备注</label>
                <textarea
                  v-model="formState.notes"
                  class="theme-textarea"
                  rows="4"
                  placeholder="请输入备注信息"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="theme-btn theme-btn-secondary" @click="modalVisible = false">取消</button>
            <button class="theme-btn theme-btn-primary" @click="handleOk">确定</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { billAPI, debtPlatformAPI, repaymentAPI } from '@/services/api'
import AppLayout from '@/components/Layout/AppLayout.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import Dropdown from '@/components/ui/Dropdown.vue'

const loading = ref(false)
const repayments = ref([])
const bills = ref([])
const platforms = ref([])
const modalVisible = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const currentPageInput = ref(1)
const total = ref(0)

const pageSizeOptions = [
  { value: 10, label: '10 条' },
  { value: 20, label: '20 条' },
  { value: 50, label: '50 条' },
  { value: 100, label: '100 条' }
]

const filters = reactive({
  platform_id: '',
  start_date: '',
  end_date: ''
})

const formState = reactive({
  bill_id: '',
  amount: null,
  interest: null,
  repayment_date: '',
  notes: ''
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

const billOptions = computed(() =>
  bills.value.map((bill) => ({
    value: bill.id,
    label: `${bill.platform_name} · ¥${Number(bill.amount || 0).toFixed(2)} · ${bill.billing_month}`
  }))
)

const platformOptions = computed(() => platforms.value.map((item) => ({ value: item.id, label: item.name })))
const platformSelectOptions = computed(() => [
  { value: '', label: '全部平台' },
  ...platformOptions.value
])

const goToFirst = () => {
  currentPage.value = 1
}

const goToLast = () => {
  currentPage.value = totalPages.value
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

const hasPartialDateRange = computed(
  () => Boolean(filters.start_date) !== Boolean(filters.end_date)
)

const loadRepayments = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      page_size: pageSize.value
    }

    if (filters.platform_id) params.platform_id = filters.platform_id
    if (filters.start_date && filters.end_date) {
      params.start_date = filters.start_date
      params.end_date = filters.end_date
    }

    const response = await repaymentAPI.getAllRecords(params)
    const items = response?.items && Array.isArray(response.items) ? response.items : []
    const nextTotal = Number(response?.total || 0)
    const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize.value))

    if (currentPage.value > nextTotalPages) {
      currentPage.value = nextTotalPages
      return
    }

    repayments.value = items.map((record) => ({
      ...record,
      amount: Number(record.amount || 0),
      interest: record.interest ?? null,
      bill_interest: record.bill_interest ?? null
    }))
    total.value = nextTotal
    currentPageInput.value = currentPage.value
  } catch (error) {
    console.error('加载还款记录失败:', error)
    window.$message?.error('加载还款记录失败')
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  if (hasPartialDateRange.value) {
    window.$message?.warning('请同时选择开始日期和结束日期')
    return
  }

  currentPageInput.value = 1
  if (currentPage.value !== 1) {
    currentPage.value = 1
    return
  }

  await loadRepayments()
}

const resetFilters = async () => {
  filters.platform_id = ''
  filters.start_date = ''
  filters.end_date = ''
  currentPageInput.value = 1

  if (currentPage.value !== 1) {
    currentPage.value = 1
    return
  }

  await loadRepayments()
}

const loadBills = async () => {
  try {
    bills.value = await billAPI.getAll()
  } catch (error) {
    console.error('加载账单失败:', error)
  }
}

const loadPlatforms = async () => {
  try {
    platforms.value = await debtPlatformAPI.getAll()
  } catch (error) {
    console.error('加载平台失败:', error)
  }
}

const handleBillChange = (billId) => {
  if (!billId) {
    formState.interest = null
    return
  }

  const selectedBill = bills.value.find((bill) => bill.id == billId)
  if (selectedBill) {
    formState.interest = Number(selectedBill.interest || 0)
  }
}

const showModal = () => {
  Object.assign(formState, {
    bill_id: '',
    amount: null,
    interest: null,
    repayment_date: dayjs().format('YYYY-MM-DD'),
    notes: ''
  })
  modalVisible.value = true
}

const handleOk = async () => {
  try {
    if (!formState.bill_id) {
      window.$message?.error('请选择账单')
      return
    }
    if (!formState.amount || formState.amount <= 0) {
      window.$message?.error('请输入有效还款金额')
      return
    }
    if (!formState.repayment_date) {
      window.$message?.error('请选择还款日期')
      return
    }

    await repaymentAPI.create({
      bill_id: formState.bill_id,
      amount: Number(formState.amount),
      interest: Number(formState.interest || 0),
      repayment_date: formState.repayment_date,
      notes: formState.notes
    })

    window.$message?.success('还款记录添加成功')
    modalVisible.value = false
    await loadRepayments()
  } catch (error) {
    console.error('添加还款记录失败:', error)
    window.$message?.error('添加还款记录失败')
  }
}

const deleteRecord = async (record) => {
  if (!confirm('确定要删除这条还款记录吗？')) return

  try {
    await repaymentAPI.delete(record.id)
    window.$message?.success('删除成功')
    if (repayments.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1
    }
    await loadRepayments()
  } catch (error) {
    console.error('删除还款记录失败:', error)
    window.$message?.error('删除还款记录失败')
  }
}

const formatDate = (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '')

const formatInterest = (item) => {
  const shouldUseBillInterest =
    Number(item.interest ?? 0) === 0 &&
    Number(item.bill_interest ?? 0) > 0 &&
    String(item.notes || '').startsWith('自动记录')

  const value = shouldUseBillInterest ? item.bill_interest : item.interest ?? item.bill_interest ?? 0
  return Number(value || 0).toFixed(2)
}

watch(currentPageInput, (value) => {
  if (Number.isInteger(value) && value >= 1 && value <= totalPages.value) {
    currentPage.value = value
  }
})

watch(pageSize, () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1
    return
  }

  loadRepayments()
})

watch(currentPage, () => {
  loadRepayments()
})

onMounted(async () => {
  await Promise.all([loadBills(), loadPlatforms()])
  await loadRepayments()
})
</script>

<style scoped>
.repayments-table {
  min-width: 1040px;
}

.pager-meta {
  flex-wrap: nowrap;
  overflow-x: auto;
  white-space: nowrap;
}

.page-size-select {
  flex: 0 0 108px;
  min-width: 108px;
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
</style>
