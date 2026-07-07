<template>
  <div class="attendance">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考勤管理</span>
          <div>
            <el-select v-model="selectedCourse" placeholder="选择课程" style="width: 200px; margin-right: 10px;">
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.name"
                :value="course.id"
              />
            </el-select>
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              style="width: 200px; margin-right: 10px;"
            />
            <el-button type="primary" @click="showAttendanceDialog">
              <el-icon><Calendar /></el-icon>
              开始签到
            </el-button>
            <el-button @click="exportAttendance">
              <el-icon><Download /></el-icon>
              导出考勤
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="attendanceList" style="width: 100%" v-loading="loading">
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="studentName" label="姓名" width="120" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="签到时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="editAttendance(row)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>考勤统计</span>
          </template>
          <div class="attendance-stats">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="出勤率" :value="stats.attendanceRate" :precision="1" suffix="%" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="迟到次数" :value="stats.lateCount" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="缺勤次数" :value="stats.absentCount" />
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>考勤记录</span>
          </template>
          <div class="attendance-records">
            <div v-for="(record, index) in recentRecords" :key="index" class="record-item">
              <div class="record-date">{{ record.date }}</div>
              <div class="record-status">
                <el-tag :type="getStatusType(record.status)" size="small">
                  {{ getStatusText(record.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 签到对话框 -->
    <el-dialog v-model="attendanceDialogVisible" title="开始签到" width="500px">
      <el-form
        ref="attendanceFormRef"
        :model="attendanceForm"
        :rules="attendanceRules"
        label-width="100px"
      >
        <el-form-item label="课程" prop="courseId">
          <el-select v-model="attendanceForm.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="attendanceForm.date"
            type="date"
            placeholder="请选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="签到方式" prop="type">
          <el-radio-group v-model="attendanceForm.type">
            <el-radio label="manual">手动签到</el-radio>
            <el-radio label="code">签到码</el-radio>
            <el-radio label="location">定位签到</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="attendanceForm.type === 'code'" label="签到码" prop="code">
          <el-input v-model="attendanceForm.code" placeholder="请输入签到码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="attendanceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleStartAttendance" :loading="attendanceLoading">
            开始签到
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改考勤对话框 -->
    <el-dialog v-model="editDialogVisible" title="修改考勤" width="500px">
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="学生姓名">
          <el-input v-model="editForm.studentName" disabled />
        </el-form-item>
        <el-form-item label="日期">
          <el-input v-model="editForm.date" disabled />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="出勤" value="present" />
            <el-option label="迟到" value="late" />
            <el-option label="缺勤" value="absent" />
            <el-option label="请假" value="leave" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditAttendance" :loading="editLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const attendanceList = ref([])
const courses = ref([])
const selectedCourse = ref('')
const selectedDate = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const attendanceDialogVisible = ref(false)
const editDialogVisible = ref(false)
const attendanceLoading = ref(false)
const editLoading = ref(false)

const stats = ref({
  attendanceRate: 0,
  lateCount: 0,
  absentCount: 0
})

const recentRecords = ref([])

const attendanceForm = ref({
  courseId: '',
  date: '',
  type: 'manual',
  code: ''
})

const editForm = ref({
  id: null,
  studentName: '',
  date: '',
  status: ''
})

const attendanceRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  type: [{ required: true, message: '请选择签到方式', trigger: 'change' }]
}

const editRules = {
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const getStatusType = (status) => {
  const types = {
    present: 'success',
    late: 'warning',
    absent: 'danger',
    leave: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    present: '出勤',
    late: '迟到',
    absent: '缺勤',
    leave: '请假'
  }
  return texts[status] || status
}

const fetchAttendance = async () => {
  loading.value = true
  try {
    const response = await api.get('/attendance', {
      params: {
        courseId: selectedCourse.value,
        date: selectedDate.value,
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    attendanceList.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('获取考勤列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchCourses = async () => {
  try {
    const response = await api.get('/courses')
    courses.value = response.data
  } catch (error) {
    console.error('获取课程列表失败:', error)
  }
}

const fetchStats = async () => {
  try {
    const response = await api.get('/attendance/stats', {
      params: { courseId: selectedCourse.value }
    })
    stats.value = response.data.stats
    recentRecords.value = response.data.recentRecords
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const showAttendanceDialog = () => {
  attendanceForm.value = {
    courseId: selectedCourse.value,
    date: new Date(),
    type: 'manual',
    code: ''
  }
  attendanceDialogVisible.value = true
}

const editAttendance = (attendance) => {
  editForm.value = {
    id: attendance.id,
    studentName: attendance.studentName,
    date: attendance.date,
    status: attendance.status
  }
  editDialogVisible.value = true
}

const handleStartAttendance = async () => {
  try {
    attendanceLoading.value = true
    await api.post('/attendance/start', attendanceForm.value)
    ElMessage.success('签到开始成功')
    attendanceDialogVisible.value = false
    fetchAttendance()
  } catch (error) {
    console.error('开始签到失败:', error)
  } finally {
    attendanceLoading.value = false
  }
}

const handleEditAttendance = async () => {
  try {
    editLoading.value = true
    await api.put(`/attendance/${editForm.value.id}`, editForm.value)
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    fetchAttendance()
  } catch (error) {
    console.error('修改失败:', error)
  } finally {
    editLoading.value = false
  }
}

const exportAttendance = async () => {
  try {
    const response = await api.get('/attendance/export', {
      params: { courseId: selectedCourse.value },
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '考勤表.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchAttendance()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchAttendance()
}

watch([selectedCourse, selectedDate], () => {
  currentPage.value = 1
  fetchAttendance()
  fetchStats()
})

onMounted(() => {
  fetchCourses()
  fetchAttendance()
  fetchStats()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.mt-20 {
  margin-top: 20px;
}

.attendance-stats {
  padding: 20px;
}

.attendance-records {
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-date {
  font-size: 14px;
  color: #606266;
}
</style>
