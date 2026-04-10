<template>
  <AppLayout>
    <div style="padding: 0;">
      <!-- 页面标题 -->
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #141414; margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">🏦</span>
          借款平台
        </h1>
        <p style="font-size: 16px; color: #8c8c8c; margin: 0;">管理您的借款平台信息，包括账单日和还款日设置</p>
      </div>

      <!-- 操作栏 -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索平台名称..."
            class="theme-input"
            style="padding: 8px 14px; border: 1px solid #d9d9d9; border-radius: 8px; font-size: 15px; width: 240px; outline: none; transition: all 0.2s;"
            @focus="$event.target.style.borderColor = '#1677ff'; $event.target.style.boxShadow = '0 0 0 2px rgba(22,119,255,0.1)'"
            @blur="$event.target.style.borderColor = '#d9d9d9'; $event.target.style.boxShadow = 'none'"
          />
        </div>
        <button @click="showModal" class="theme-btn theme-btn-primary" style="padding: 8px 14px; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加平台
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
            <col style="width: 320px;" />
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>平台名称</th>
              <th>账单出账日</th>
              <th>还款日</th>
              <th>额度</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedPlatforms" :key="item.id">
              <td style="color: #bfbfbf;">#{{ item.id }}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 32px; height: 32px; border-radius: 6px; background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span style="font-size: 14px; font-weight: 600; color: #1677ff;">{{ item.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <span style="font-size: 14px; font-weight: 500; color: #141414; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.name">{{ item.name }}</span>
                </div>
              </td>
              <td>{{ item.billing_day }}日</td>
              <td>{{ item.repayment_day }}日</td>
              <td style="color: #1677ff; font-weight: 600;">¥{{ Number(item.credit_limit).toFixed(2) }}</td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button @click="editPlatform(item)" class="theme-btn theme-btn-outline" style="padding: 6px 10px; font-size: 13px;">编辑</button>
                  <button @click="deletePlatform(item)" class="theme-btn theme-btn-danger" style="padding: 6px 10px; font-size: 13px;">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="sortedPlatforms.length === 0">
              <td :colspan="6" style="padding: 60px 20px; text-align: center;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; color: #8c8c8c; margin: 0 auto 16px;">
                  <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m8-2a2 2 0 1 1-4 0m2 2a2 2 0 1 1-4 0" />
                </svg>
                <p style="margin: 0; font-size: 16px; color: #8c8c8c;">暂无平台数据</p>
              </td>
            </tr>
          </tbody>
        </table>
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
              <label class="form-label">平台名称</label>
              <input 
                v-model="formState.name" 
                type="text" 
                placeholder="请输入平台名称"
                class="theme-input"
              />
            </div>

            <div class="form-row">
              <div class="form-item">
                <label class="form-label">账单出账日</label>
                <input 
                  v-model.number="formState.billing_day" 
                  type="number" 
                  min="1" 
                  max="31" 
                  placeholder="1-31"
                  class="theme-input"
                />
              </div>
              <div class="form-item">
                <label class="form-label">还款日</label>
                <input 
                  v-model.number="formState.repayment_day" 
                  type="number" 
                  min="1" 
                  max="31" 
                  placeholder="1-31"
                  class="theme-input"
                />
              </div>
            </div>

            <div class="form-item">
              <label class="form-label">额度</label>
              <input 
                v-model.number="formState.credit_limit" 
                type="number" 
                min="0" 
                placeholder="请输入额度"
                class="theme-input"
              />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { debtPlatformAPI } from '@/services/api'
import AppLayout from '@/components/Layout/AppLayout.vue'

const loading = ref(false)
const platforms = ref([])
const modalVisible = ref(false)
const editingId = ref(null)
const searchQuery = ref('')

const formState = reactive({
  name: '',
  billing_day: null,
  repayment_day: null,
  credit_limit: null
})

// 按 ID 排序并过滤
const sortedPlatforms = computed(() => {
  let result = [...platforms.value]
  
  // 按 ID 升序排序
  result.sort((a, b) => a.id - b.id)
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => item.name.toLowerCase().includes(query))
  }
  
  return result
})

const loadPlatforms = async () => {
  try {
    loading.value = true
    const response = await debtPlatformAPI.getAll()
    platforms.value = response
  } catch (error) {
    console.error('加载平台数据失败:', error)
    window.$message?.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const showModal = () => {
  editingId.value = null
  Object.assign(formState, {
    name: '',
    billing_day: null,
    repayment_day: null,
    credit_limit: null
  })
  modalVisible.value = true
}

const editPlatform = (record) => {
  editingId.value = record.id
  Object.assign(formState, {
    name: record.name,
    billing_day: record.billing_day,
    repayment_day: record.repayment_day,
    credit_limit: record.credit_limit
  })
  modalVisible.value = true
}

const handleOk = async () => {
  try {
    if (!formState.name) {
      window.$message?.error('请输入平台名称')
      return
    }
    if (!formState.billing_day || formState.billing_day < 1 || formState.billing_day > 31) {
      window.$message?.error('出账日需在 1-31 之间')
      return
    }
    if (!formState.repayment_day || formState.repayment_day < 1 || formState.repayment_day > 31) {
      window.$message?.error('还款日需在 1-31 之间')
      return
    }

    if (editingId.value) {
      await debtPlatformAPI.update(editingId.value, formState)
      window.$message?.success('平台更新成功')
    } else {
      await debtPlatformAPI.create(formState)
      window.$message?.success('平台创建成功')
    }

    modalVisible.value = false
    loadPlatforms()
  } catch (error) {
    console.error('操作失败:', error)
    window.$message?.error('操作失败')
  }
}

const deletePlatform = async (record) => {
  if (!confirm('确定要删除这个平台吗？')) return
  try {
    await debtPlatformAPI.delete(record.id)
    window.$message?.success('删除成功')
    loadPlatforms()
  } catch (error) {
    console.error('删除失败:', error)
    window.$message?.error('删除失败')
  }
}

const modalTitle = computed(() => editingId.value ? '编辑平台' : '添加平台')

onMounted(() => {
  loadPlatforms()
})
</script>

<style scoped>
/* 主题化表格 */
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

/* 主题化按钮 */
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
  gap: 6px;
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

/* 主题化输入框 */
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

.theme-input::placeholder {
  color: #bfbfbf;
}

/* 主题化弹窗 */
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
  max-width: 480px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
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

/* 表单样式 */
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
