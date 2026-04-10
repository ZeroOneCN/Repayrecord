<template>
  <AppLayout>
    <div style="padding: 0;">
      <!-- 页面标题 -->
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #141414; margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">💳</span>
          还款记录
        </h1>
        <p style="font-size: 16px; color: #8c8c8c; margin: 0;">记录和管理您的还款历史，跟踪每笔还款详情</p>
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
          <div style="display: flex; align-items: center; gap: 8px;">
            <DatePicker v-model="filters.start_date" type="date" placeholder="开始日期" style="width: 130px;" />
            <span style="color: #d9d9d9; font-size: 14px;">-</span>
            <DatePicker v-model="filters.end_date" type="date" placeholder="结束日期" style="width: 130px;" />
          </div>
        </div>
        <button @click="showModal" class="theme-btn theme-btn-primary" style="padding: 8px 14px; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加还款记录
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
            <col />
            <col style="width: 320px;" />
          </colgroup>
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
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td style="color: #bfbfbf;">#{{ item.id }}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 32px; height: 32px; border-radius: 6px; background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span style="font-size: 14px; font-weight: 600; color: #1677ff;">{{ item.platform_name?.charAt(0).toUpperCase() || 'P' }}</span>
                  </div>
                  <span style="font-size: 14px; font-weight: 500; color: #141414;">{{ item.platform_name }}</span>
                </div>
              </td>
              <td style="font-weight: 600; color: #52c41a;">¥{{ Number(item.amount).toFixed(2) }}</td>
              <td style="color: #8c8c8c;">¥{{ Number(item.interest || 0).toFixed(2) }}</td>
              <td>{{ formatDate(item.repayment_date) }}</td>
              <td style="color: #8c8c8c;">{{ item.notes || '-' }}</td>
              <td>
                <button @click="deleteRecord(item)" class="theme-btn theme-btn-danger" style="padding: 6px 10px; font-size: 13px;">删除</button>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td :colspan="7" style="padding: 60px 20px; text-align: center;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; color: #8c8c8c; margin: 0 auto 16px;">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <p style="margin: 0; font-size: 16px; color: #8c8c8c;">暂无还款记录</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding: 12px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 14px; color: #8c8c8c;">每页显示</span>
          <Dropdown 
            v-model="pageSize" 
            :options="pageSizeOptions"
            style="width: 90px;"
          />
          <span style="font-size: 14px; color: #8c8c8c;">条</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px; color: #595959;">共 {{ total }} 条</span>
          <span style="font-size: 14px; color: #8c8c8c;">第</span>
          <input 
            v-model.number="currentPageInput" 
            type="number" 
            min="1" 
            :max="totalPages"
            style="width: 50px; padding: 4px 6px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; text-align: center;"
          />
          <span style="font-size: 14px; color: #8c8c8c;">页</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button @click="goToFirst" :disabled="currentPage === 1" class="theme-btn theme-btn-outline" style="padding: 6px 10px;" :style="currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="11,17 6,12 11,7" />
              <polyline points="18,17 13,12 18,7" />
            </svg>
          </button>
          <button @click="prevPage" :disabled="currentPage === 1" class="theme-btn theme-btn-outline" style="padding: 6px 10px;" :style="currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <div style="display: flex; gap: 4px;">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              @click="currentPage = page"
              :class="['theme-btn', currentPage === page ? 'theme-btn-primary' : 'theme-btn-outline']"
              style="padding: 6px 10px; min-width: 32px;"
            >
              {{ page }}
            </button>
          </div>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="theme-btn theme-btn-outline" style="padding: 6px 10px;" :style="currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
          <button @click="goToLast" :disabled="currentPage === totalPages" class="theme-btn theme-btn-outline" style="padding: 6px 10px;" :style="currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="13,17 18,12 13,7" />
              <polyline points="6,17 11,12 6,7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 添加弹窗 -->
      <div v-if="modalVisible" class="modal-overlay" @click="modalVisible = false">
        <div class="theme-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">添加还款记录</h3>
            <button @click="modalVisible = false" class="modal-close" title="关闭">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="form-item">
              <label class="form-label">选择账单</label>
              <Dropdown v-model="formState.bill_id" :options="billOptions" placeholder="请选择账单" />
            </div>

            <div class="form-row">
              <div class="form-item">
                <label class="form-label">还款金额</label>
                <input v-model.number="formState.amount" type="number" min="0" placeholder="请输入还款金额" class="theme-input" />
              </div>
              <div class="form-item">
                <label class="form-label">还款利息</label>
                <input v-model.number="formState.interest" type="number" min="0" placeholder="请输入还款利息" class="theme-input" />
              </div>
            </div>

            <div class="form-item">
              <label class="form-label">还款日期</label>
              <DatePicker v-model="formState.repayment_date" type="date" placeholder="选择还款日期" />
            </div>

            <div class="form-item">
              <label class="form-label">备注</label>
              <textarea v-model="formState.notes" placeholder="请输入备注信息" rows="3" class="theme-input" style="resize: none;"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="modalVisible = false" class="theme-btn theme-btn-secondary">取消</button>
            <button @click="handleOk" class="theme-btn theme-btn-success">确定</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { repaymentAPI, billAPI, debtPlatformAPI } from '@/services/api'
import dayjs from 'dayjs'
import AppLayout from '@/components/Layout/AppLayout.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import DatePicker from '@/components/ui/DatePicker.vue'

const loading = ref(false)
const repayments = ref([])
const bills = ref([])
const platforms = ref([])
const modalVisible = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const currentPageInput = ref(1)

const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 100, label: '100' }
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

const filteredData = computed(() => {
  let result = [...repayments.value]
  
  if (filters.platform_id) {
    result = result.filter(item => item.platform_id == filters.platform_id)
  }
  if (filters.start_date && filters.end_date) {
    result = result.filter(item => {
      const date = dayjs(item.repayment_date)
      return date.isAfter(dayjs(filters.start_date).subtract(1, 'day')) && 
             date.isBefore(dayjs(filters.end_date).add(1, 'day'))
    })
  }
  
  return result
})

const total = computed(() => filteredData.value.length)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const billOptions = computed(() =>
  bills.value.map(bill => ({
    value: bill.id,
    label: `${bill.platform_name} - ¥${bill.amount} - ${bill.billing_month}`
  }))
)

const platformOptions = computed(() =>
  platforms.value.map(p => ({ value: p.id, label: p.name }))
)

const platformSelectOptions = computed(() => [
  { value: '', label: '全部平台' },
  ...platformOptions.value
])

const goToFirst = () => {
  currentPage.value = 1
  currentPageInput.value = 1
}

const goToLast = () => {
  currentPage.value = totalPages.value
  currentPageInput.value = totalPages.value
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    currentPageInput.value = currentPage.value
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    currentPageInput.value = currentPage.value
  }
}

watch(currentPageInput, (val) => {
  if (val >= 1 && val <= totalPages.value) {
    currentPage.value = val
  }
})

watch(pageSize, () => {
  currentPage.value = 1
  currentPageInput.value = 1
})

const loadRepayments = async () => {
  try {
    loading.value = true
    const params = {}
    if (filters.platform_id) params.platform_id = filters.platform_id
    if (filters.start_date && filters.end_date) {
      params.start_date = filters.start_date
      params.end_date = filters.end_date
    }
    const response = await repaymentAPI.getAllRecords(params)
    if (response?.items && Array.isArray(response.items)) {
      repayments.value = response.items.map(r => ({ ...r, amount: parseFloat(r.amount) }))
    } else {
      const rows = Array.isArray(response) ? response : []
      repayments.value = rows.map(r => ({ ...r, amount: parseFloat(r.amount) }))
        .sort((a, b) => dayjs(b.repayment_date).valueOf() - dayjs(a.repayment_date).valueOf())
    }
  } catch (error) {
    console.error('加载还款记录失败:', error)
    window.$message?.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadBills = async () => {
  try {
    const response = await billAPI.getAll()
    bills.value = response
  } catch (error) {
    console.error('加载账单数据失败:', error)
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

    const submitData = {
      bill_id: formState.bill_id,
      amount: formState.amount,
      interest: formState.interest || 0,
      repayment_date: formState.repayment_date,
      notes: formState.notes
    }

    await repaymentAPI.create(submitData)
    window.$message?.success('还款记录添加成功')

    modalVisible.value = false
    loadRepayments()
  } catch (error) {
    console.error('添加还款记录失败:', error)
    window.$message?.error('操作失败')
  }
}

const deleteRecord = async (record) => {
  if (!confirm('确定要删除这条还款记录吗？')) return
  try {
    await repaymentAPI.delete(record.id)
    window.$message?.success('删除成功')
    loadRepayments()
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
  currentPage.value = 1
  currentPageInput.value = 1
  loadRepayments()
}, { deep: true })

onMounted(() => {
  loadBills()
  loadPlatforms()
  loadRepayments()
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
