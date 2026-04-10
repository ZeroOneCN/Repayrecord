<template>
  <AppLayout>
    <div style="padding: 0;">
      <!-- 页面标题 -->
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #141414; margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">📋</span>
          账单管理
        </h1>
        <p style="font-size: 16px; color: #8c8c8c; margin: 0;">管理您的借款账单，包括还款状态跟踪和逾期提醒</p>
      </div>

      <!-- 筛选栏 -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; gap: 12px;">
          <Dropdown
            v-model="filters.platform_id"
            :options="platformSelectOptions"
            placeholder="全部平台"
            style="width: 140px;"
          />
          <Dropdown
            v-model="filters.is_paid"
            :options="statusOptions"
            placeholder="全部状态"
            style="width: 120px;"
          />
          <DatePicker
            v-model="filters.billing_month"
            type="month"
            placeholder="账单月份"
            style="width: 140px;"
          />
        </div>
        <button @click="showModal" class="theme-btn theme-btn-primary" style="padding: 8px 14px; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加账单
        </button>
      </div>

      <!-- 表格 -->
      <div class="theme-table-container">
        <table class="theme-table" style="table-layout: fixed;">
          <colgroup>
            <col style="width: 60px;" />
            <col />
            <col style="width: 240px;" />
            <col style="width: 160px;" />
            <col style="width: 200px;" />
            <col style="width: 220px;" />
            <col style="width: 240px;" />
            <col style="width: 320px;" />
          </colgroup>
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
          <tbody>
            <tr v-for="item in currentMonthBills" :key="item.id">
              <td style="color: #bfbfbf;">#{{ item.id }}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 32px; height: 32px; border-radius: 6px; background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span style="font-size: 14px; font-weight: 600; color: #1677ff;">{{ item.platform_name?.charAt(0).toUpperCase() || 'P' }}</span>
                  </div>
                  <span style="font-size: 14px; font-weight: 500; color: #141414;">{{ item.platform_name }}</span>
                </div>
              </td>
              <td style="font-weight: 600; color: #141414;">¥{{ Number(item.amount).toFixed(2) }}</td>
              <td style="color: #8c8c8c;">¥{{ Number(item.interest || 0).toFixed(2) }}</td>
              <td>{{ item.billing_month }}</td>
              <td>{{ formatDate(item.due_date) }}</td>
              <td>
                <span :class="['status-badge', item.is_paid ? 'status-success' : 'status-error']">
                  <span :class="['status-dot', item.is_paid ? 'dot-success' : 'dot-error']"></span>
                  {{ item.is_paid ? '已还款' : '未还款' }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button v-if="!item.is_paid" @click="markAsPaid(item)" class="theme-btn theme-btn-success" style="padding: 6px 10px; font-size: 13px;">标记还款</button>
                  <button @click="editBill(item)" class="theme-btn theme-btn-outline" style="padding: 6px 10px; font-size: 13px;">编辑</button>
                  <button @click="deleteBill(item)" class="theme-btn theme-btn-danger" style="padding: 6px 10px; font-size: 13px;">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="currentMonthBills.length === 0">
              <td :colspan="8" style="padding: 60px 20px; text-align: center;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; color: #8c8c8c; margin: 0 auto 16px;">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <p style="margin: 0; font-size: 16px; color: #8c8c8c;">暂无账单数据</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 月份分页 -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding: 12px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button @click="prevMonth" :disabled="currentPage === 1" class="theme-btn theme-btn-outline" style="padding: 6px 10px;" :style="currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <span style="font-size: 14px; color: #595959;">共 {{ uniqueMonths.length }} 个月</span>
          <button @click="nextMonth" :disabled="currentPage === totalPages" class="theme-btn theme-btn-outline" style="padding: 6px 10px;" :style="currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px; color: #8c8c8c;">当前月份：</span>
          <Dropdown 
            v-model="selectedMonth" 
            :options="monthOptions"
            placeholder="选择月份"
            style="width: 140px;"
          />
        </div>
      </div>

      <!-- 添加/编辑弹窗 -->
      <div v-if="modalVisible" class="modal-overlay" @click="modalVisible = false">
        <div class="theme-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ modalTitle }}</h3>
            <button @click="modalVisible = false" class="modal-close" title="关闭">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="form-item">
              <label class="form-label">选择平台</label>
              <Dropdown v-model="formState.platform_id" :options="platformOptions" placeholder="请选择借款平台" />
            </div>

            <div class="form-row">
              <div class="form-item">
                <label class="form-label">账单金额</label>
                <input v-model.number="formState.amount" type="number" min="0" placeholder="请输入金额" class="theme-input" />
              </div>
              <div class="form-item">
                <label class="form-label">利息</label>
                <input v-model.number="formState.interest" type="number" min="0" placeholder="请输入利息" class="theme-input" />
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
              <textarea v-model="formState.notes" placeholder="请输入备注信息" rows="3" class="theme-input" style="resize: none;"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="modalVisible = false" class="theme-btn theme-btn-secondary">取消</button>
            <button @click="handleOk" class="theme-btn theme-btn-primary">确定</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { billAPI, debtPlatformAPI, repaymentAPI } from '@/services/api'
import dayjs from 'dayjs'
import { getPreferences } from '@/services/preferences'
import AppLayout from '@/components/Layout/AppLayout.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import DatePicker from '@/components/ui/DatePicker.vue'

const loading = ref(false)
const bills = ref([])
const platforms = ref([])
const modalVisible = ref(false)
const editingId = ref(null)
const selectedMonth = ref('')
const currentPage = ref(1)

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
  { value: 'false', label: '未还款' },
  { value: 'true', label: '已还款' }
]

const platformOptions = computed(() => 
  platforms.value.map(p => ({ value: p.id, label: p.name }))
)

const platformSelectOptions = computed(() => [
  { value: '', label: '全部平台' },
  ...platformOptions.value
])

const modalTitle = computed(() => editingId.value ? '编辑账单' : '添加账单')

const uniqueMonths = computed(() => {
  const months = new Set(bills.value.map(b => b.billing_month))
  return Array.from(months).sort((a, b) => b.localeCompare(a))
})

const monthOptions = computed(() => {
  return uniqueMonths.value.map(m => ({ value: m, label: m }))
})

const currentMonthBills = computed(() => {
  if (!selectedMonth.value) return []
  return bills.value.filter(b => b.billing_month === selectedMonth.value)
})

const totalPages = computed(() => uniqueMonths.value.length)

const prevMonth = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    selectedMonth.value = uniqueMonths.value[currentPage.value - 1]
  }
}

const nextMonth = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    selectedMonth.value = uniqueMonths.value[currentPage.value - 1]
  }
}

const loadBills = async () => {
  try {
    loading.value = true
    const params = {}
    if (filters.platform_id) params.platform_id = filters.platform_id
    if (filters.billing_month) params.billing_month = filters.billing_month
    if (filters.is_paid !== '') params.is_paid = filters.is_paid === 'true'

    const response = await billAPI.getAll(params)
    if (response?.items && Array.isArray(response.items)) {
      bills.value = response.items
    } else {
      bills.value = response || []
    }
    
    const currentMonth = dayjs().format('YYYY-MM')
    const hasCurrentMonth = bills.value.some(b => b.billing_month === currentMonth)
    
    if (hasCurrentMonth) {
      selectedMonth.value = currentMonth
      currentPage.value = uniqueMonths.value.indexOf(currentMonth) + 1
    } else if (bills.value.length > 0 && !selectedMonth.value) {
      selectedMonth.value = uniqueMonths.value[0]
      currentPage.value = 1
    }
  } catch (error) {
    console.error('加载账单数据失败:', error)
    window.$message?.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadPlatforms = async () => {
  try {
    const response = await debtPlatformAPI.getAll()
    platforms.value = response
  } catch (error) {
    console.error('加载平台数据失败:', error)
  }
}

const autoSetDueDate = () => {
  try {
    const pid = formState.platform_id
    const monthVal = formState.billing_month
    if (!pid || !monthVal) return
    const platform = platforms.value.find(p => p.id == pid)
    if (!platform || !platform.repayment_day) return
    const yymm = dayjs(monthVal + '-01')
    const daysInMonth = yymm.daysInMonth()
    const day = Math.min(parseInt(platform.repayment_day, 10), daysInMonth)
    formState.due_date = yymm.date(day).format('YYYY-MM-DD')
  } catch (_) {}
}

watch(() => formState.platform_id, () => autoSetDueDate())
watch(() => formState.billing_month, () => autoSetDueDate())

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
    amount: record.amount,
    interest: record.interest,
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
      window.$message?.error('请选择月份')
      return
    }

    const submitData = {
      platform_id: formState.platform_id,
      amount: formState.amount,
      interest: formState.interest || 0,
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
    loadBills()
  } catch (error) {
    console.error('操作失败:', error)
    window.$message?.error('操作失败')
  }
}

const markAsPaid = async (record) => {
  try {
    await billAPI.markAsPaid(record.id)
    try {
      const prefs = getPreferences()
      if (prefs.autoRepaymentOnMarkPaid) {
        await repaymentAPI.create({
          bill_id: record.id,
          amount: record.amount,
          repayment_date: dayjs().format('YYYY-MM-DD'),
          notes: '自动记录：账单标记为已还'
        })
      }
    } catch (_) {}
    window.$message?.success('标记还款成功')
    loadBills()
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
    loadBills()
  } catch (error) {
    console.error('删除失败:', error)
    window.$message?.error('删除失败')
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

watch(() => ({ ...filters }), () => {
  loadBills()
}, { deep: true })

onMounted(() => {
  loadPlatforms()
  loadBills()
})
</script>

<style scoped>
.theme-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.theme-table {
  width: 100%;
  border-collapse: collapse;
}

.theme-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #595959;
  border-bottom: 2px solid #e8e8e8;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

.theme-table td {
  padding: 12px 16px;
  font-size: 14px;
  color: #595959;
  border-bottom: 1px solid #f0f0f0;
}

.theme-table tbody tr {
  transition: all 0.2s;
}

.theme-table tbody tr:hover {
  background: #fafafa;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.status-success {
  background: #f6ffed;
  color: #52c41a;
}

.status-error {
  background: #fff1f0;
  color: #ff4d4f;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.dot-success {
  background: #52c41a;
}

.dot-error {
  background: #ff4d4f;
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

.theme-btn-secondary {
  background: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.theme-btn-secondary:hover {
  background: #e8e8e8;
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

.theme-btn-success {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
}

.theme-btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

.theme-btn-danger {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.theme-btn-danger:hover {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

.theme-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  background: white;
  box-sizing: border-box;
}

.theme-input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.theme-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #141414;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c8c8c;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #ff4d4f;
  color: white;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.modal-footer .theme-btn {
  flex: 1;
  padding: 12px;
  font-size: 15px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #595959;
  margin-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
</style>
