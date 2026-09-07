<template>
  <AppLayout>
    <div class="page-shell">
      <section class="page-header">
        <div class="page-header-main">
          <span class="page-icon-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M8 3H16L20 7V19A2 2 0 0 1 18 21H8A2 2 0 0 1 6 19V5A2 2 0 0 1 8 3Z" />
              <path d="M15 3V8H20" />
              <path d="M9 13H16" />
              <path d="M9 17H14" />
            </svg>
          </span>
          <div>
            <p class="page-kicker">Bills</p>
            <h1 class="page-title">账单管理</h1>
            <p class="page-description">
              按月份查看和维护账单状态。标记为已还时，可根据设置自动同步生成还款流水与利息记录。
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
                <Dropdown v-model="filters.is_paid" :options="statusOptions" placeholder="全部状态" />
              </div>
              <div class="filter-item">
                <DatePicker v-model="filters.billing_month" type="month" placeholder="账单月份" />
              </div>
            </div>
          </div>
          <div class="toolbar-actions">
            <button class="theme-btn theme-btn-primary" @click="showModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加账单
            </button>
          </div>
        </div>

        <div class="data-table-shell">
          <table class="data-table bills-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>平台</th>
                <th>金额</th>
                <th>利息</th>
                <th>账单月份</th>
                <th>还款截止日</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody v-if="currentMonthBills.length">
              <tr v-for="item in currentMonthBills" :key="item.id">
                <td class="table-cell-muted">#{{ item.id }}</td>
                <td>
                  <div class="table-platform">
                    <span class="table-avatar">{{ item.platform_name?.charAt(0).toUpperCase() || 'P' }}</span>
                    <span class="table-platform-name">{{ item.platform_name }}</span>
                  </div>
                </td>
                <td class="table-cell-strong">¥{{ Number(item.amount || 0).toFixed(2) }}</td>
                <td class="table-cell-muted">¥{{ Number(item.interest || 0).toFixed(2) }}</td>
                <td>{{ item.billing_month }}</td>
                <td>{{ formatDate(item.due_date) }}</td>
                <td>
                  <span :class="['status-chip', item.is_paid ? 'status-chip-success' : 'status-chip-danger']">
                    {{ item.is_paid ? '已还款' : '未还款' }}
                  </span>
                </td>
                <td>
                  <div class="table-actions">
                    <button
                      v-if="!item.is_paid"
                      class="theme-btn theme-btn-success"
                      @click="markAsPaid(item)"
                    >
                      标记还款
                    </button>
                    <button class="theme-btn theme-btn-outline" @click="editBill(item)">编辑</button>
                    <button class="theme-btn theme-btn-danger" @click="deleteBill(item)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="8">
                  <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M8 3H16L20 7V19A2 2 0 0 1 18 21H8A2 2 0 0 1 6 19V5A2 2 0 0 1 8 3Z" />
                      <path d="M15 3V8H20" />
                    </svg>
                    <p class="empty-title">当前筛选下没有账单</p>
                    <p class="empty-description">你可以切换月份、平台或状态筛选，或者直接创建新的账单记录。</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pager">
          <div class="pager-meta">
            <span>共 {{ uniqueMonths.length }} 个账单月份</span>
            <span v-if="selectedMonth">当前查看 {{ selectedMonth }}</span>
            <button class="theme-btn theme-btn-outline" :disabled="!selectedMonth" @click="prevMonth">
              上个月
            </button>
            <button class="theme-btn theme-btn-outline" :disabled="!selectedMonth" @click="nextMonth">
              下个月
            </button>
          </div>
        </div>
      </section>

      <div v-if="modalVisible" class="modal-overlay" @click="modalVisible = false">
        <div class="theme-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ modalTitle }}</h3>
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
                <label class="form-label">选择平台</label>
                <Dropdown v-model="formState.platform_id" :options="platformOptions" placeholder="请选择借款平台" />
              </div>

              <div class="form-row">
                <div class="form-item">
                  <label class="form-label">账单金额</label>
                  <input v-model.number="formState.amount" class="theme-input" type="number" min="0" placeholder="请输入金额" />
                </div>
                <div class="form-item">
                  <label class="form-label">利息</label>
                  <input v-model.number="formState.interest" class="theme-input" type="number" min="0" placeholder="请输入利息" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-item">
                  <label class="form-label">账单月份</label>
                  <DatePicker v-model="formState.billing_month" type="month" placeholder="选择月份" />
                </div>
                <div class="form-item">
                  <label class="form-label">还款截止日期</label>
                  <DatePicker v-model="formState.due_date" type="date" placeholder="选择日期" />
                </div>
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
import { billAPI, debtPlatformAPI } from '@/services/api'
import { settleBillWithAutoRepayment } from '@/services/repaymentFlow'
import AppLayout from '@/components/Layout/AppLayout.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import Dropdown from '@/components/ui/Dropdown.vue'

const loading = ref(false)
const bills = ref([])
const platforms = ref([])
const modalVisible = ref(false)
const editingId = ref(null)
const selectedMonth = ref('')

const filters = reactive({
  platform_id: '',
  billing_month: '',
  is_paid: ''
})

const formState = reactive({
  platform_id: '',
  amount: null,
  interest: null,
  billing_month: '',
  due_date: '',
  notes: ''
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'false', label: '未还款' },
  { value: 'true', label: '已还款' }
]

const platformOptions = computed(() => platforms.value.map((item) => ({ value: item.id, label: item.name })))
const platformSelectOptions = computed(() => [
  { value: '', label: '全部平台' },
  ...platformOptions.value
])
const modalTitle = computed(() => (editingId.value ? '编辑账单' : '添加账单'))

const uniqueMonths = computed(() => {
  const months = new Set(bills.value.map((item) => item.billing_month).filter(Boolean))
  return Array.from(months).sort((a, b) => b.localeCompare(a))
})

const currentMonthBills = computed(() => {
  if (!selectedMonth.value) return []
  return bills.value.filter((bill) => bill.billing_month === selectedMonth.value)
})

const applySelectedMonth = (month) => {
  if (!month) return

  selectedMonth.value = month

  if (filters.billing_month !== month) {
    filters.billing_month = month
  }
}

const syncCurrentMonth = (preferredMonth = filters.billing_month) => {
  if (!uniqueMonths.value.length) {
    selectedMonth.value = preferredMonth || dayjs().format('YYYY-MM')
    return
  }

  if (preferredMonth) {
    applySelectedMonth(preferredMonth)
    return
  }

  if (selectedMonth.value) {
    applySelectedMonth(selectedMonth.value)
    return
  }

  const currentMonth = dayjs().format('YYYY-MM')
  applySelectedMonth(uniqueMonths.value.includes(currentMonth) ? currentMonth : uniqueMonths.value[0])
}

const prevMonth = () => {
  if (!selectedMonth.value) return
  applySelectedMonth(dayjs(`${selectedMonth.value}-01`).subtract(1, 'month').format('YYYY-MM'))
}

const nextMonth = () => {
  if (!selectedMonth.value) return
  applySelectedMonth(dayjs(`${selectedMonth.value}-01`).add(1, 'month').format('YYYY-MM'))
}

const loadBills = async () => {
  try {
    loading.value = true
    const params = {}
    if (filters.platform_id) params.platform_id = filters.platform_id
    if (filters.is_paid !== '') params.is_paid = filters.is_paid === 'true'

    const response = await billAPI.getAll(params)
    bills.value = response?.items && Array.isArray(response.items) ? response.items : response || []
    syncCurrentMonth(filters.billing_month)
  } catch (error) {
    console.error('加载账单数据失败:', error)
    window.$message?.error('加载账单数据失败')
  } finally {
    loading.value = false
  }
}

const loadPlatforms = async () => {
  try {
    platforms.value = await debtPlatformAPI.getAll()
  } catch (error) {
    console.error('加载平台数据失败:', error)
  }
}

const autoSetDueDate = () => {
  try {
    if (!formState.platform_id || !formState.billing_month) return

    const platform = platforms.value.find((item) => item.id == formState.platform_id)
    if (!platform?.repayment_day) return

    const baseMonth = dayjs(`${formState.billing_month}-01`)
    const day = Math.min(Number(platform.repayment_day), baseMonth.daysInMonth())
    formState.due_date = baseMonth.date(day).format('YYYY-MM-DD')
  } catch (error) {
    console.warn('自动推导还款截止日失败:', error)
  }
}

const showModal = () => {
  editingId.value = null
  Object.assign(formState, {
    platform_id: '',
    amount: null,
    interest: null,
    billing_month: dayjs().format('YYYY-MM'),
    due_date: '',
    notes: ''
  })
  modalVisible.value = true
}

const editBill = (record) => {
  editingId.value = record.id
  Object.assign(formState, {
    platform_id: record.platform_id,
    amount: Number(record.amount),
    interest: Number(record.interest || 0),
    billing_month: record.billing_month,
    due_date: record.due_date,
    notes: record.notes || ''
  })
  modalVisible.value = true
}

const handleOk = async () => {
  try {
    if (!formState.platform_id) {
      window.$message?.error('请选择平台')
      return
    }

    if (!formState.amount || formState.amount <= 0) {
      window.$message?.error('请输入有效金额')
      return
    }

    if (!formState.billing_month) {
      window.$message?.error('请选择账单月份')
      return
    }

    const submitData = {
      platform_id: formState.platform_id,
      amount: Number(formState.amount),
      interest: Number(formState.interest || 0),
      billing_month: formState.billing_month,
      due_date: formState.due_date,
      notes: formState.notes
    }

    if (editingId.value) {
      await billAPI.update(editingId.value, submitData)
      window.$message?.success('账单更新成功')
    } else {
      await billAPI.create(submitData)
      window.$message?.success('账单创建成功')
    }

    modalVisible.value = false
    await loadBills()
  } catch (error) {
    console.error('保存账单失败:', error)
    window.$message?.error('保存账单失败')
  }
}

const markAsPaid = async (record) => {
  try {
    const result = await settleBillWithAutoRepayment(record)
    if (result.autoRepaymentError) {
      window.$message?.warning('账单已标记为已还，但自动还款流水创建失败，请到还款记录页补录')
    } else {
      window.$message?.success('账单已标记为已还')
    }
    await loadBills()
  } catch (error) {
    console.error('标记还款失败:', error)
    window.$message?.error('标记还款失败')
  }
}

const deleteBill = async (record) => {
  if (!confirm('确定要删除这个账单吗？')) return

  try {
    await billAPI.delete(record.id)
    window.$message?.success('删除成功')
    await loadBills()
  } catch (error) {
    console.error('删除账单失败:', error)
    window.$message?.error('删除账单失败')
  }
}

const formatDate = (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '')

watch(() => [formState.platform_id, formState.billing_month], autoSetDueDate)

watch(
  () => filters.billing_month,
  (value) => {
    if (!value) {
      syncCurrentMonth()
      return
    }

    if (value === selectedMonth.value) {
      return
    }

    applySelectedMonth(value)
  }
)

watch(
  () => [filters.platform_id, filters.is_paid],
  () => {
    loadBills()
  }
)

onMounted(async () => {
  await Promise.all([loadPlatforms(), loadBills()])
})
</script>

<style scoped>
.bills-table {
  min-width: 1120px;
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
