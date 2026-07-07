<template>
  <div class="grades">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成绩管理</span>
          <div>
            <el-select v-model="selectedCourse" placeholder="选择课程" style="width: 200px; margin-right: 10px;">
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.name"
                :value="course.id"
              />
            </el-select>
            <el-button type="primary" @click="exportGrades">
              <el-icon><Download /></el-icon>
              导出成绩
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="grades" style="width: 100%" v-loading="loading">
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="studentName" label="姓名" width="120" />
        <el-table-column prop="assignmentTitle" label="作业标题" />
        <el-table-column prop="score" label="分数" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.score < 60 }">
              {{ row.score !== null ? row.score : '未批改' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="gradedAt" label="批改时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">查看详情</el-button>
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
            <span>成绩统计</span>
          </template>
          <div class="grade-stats">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="平均分" :value="stats.average" :precision="1" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="最高分" :value="stats.max" :precision="1" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="最低分" :value="stats.min" :precision="1" />
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>分数分布</span>
          </template>
          <div class="grade-distribution">
            <div v-for="(count, range) in distribution" :key="range" class="distribution-item">
              <span class="range">{{ range }}:</span>
              <el-progress :percentage="(count / total) * 100" :stroke-width="10" />
              <span class="count">{{ count }}人</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const grades = ref([])
const courses = ref([])
const selectedCourse = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const stats = ref({
  average: 0,
  max: 0,
  min: 0
})

const distribution = ref({
  '90-100': 0,
  '80-89': 0,
  '70-79': 0,
  '60-69': 0,
  '0-59': 0
})

const fetchGrades = async () => {
  loading.value = true
  try {
    const response = await api.get('/grades', {
      params: {
        courseId: selectedCourse.value,
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    grades.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('获取成绩列表失败:', error)
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
    const response = await api.get('/grades/stats', {
      params: { courseId: selectedCourse.value }
    })
    stats.value = response.data.stats
    distribution.value = response.data.distribution
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const exportGrades = async () => {
  try {
    const response = await api.get('/grades/export', {
      params: { courseId: selectedCourse.value },
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '成绩表.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

const viewDetail = (grade) => {
  // 查看成绩详情
  console.log('查看成绩详情:', grade)
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchGrades()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchGrades()
}

watch(selectedCourse, () => {
  currentPage.value = 1
  fetchGrades()
  fetchStats()
})

onMounted(() => {
  fetchCourses()
  fetchGrades()
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

.grade-stats {
  padding: 20px;
}

.grade-distribution {
  padding: 20px;
}

.distribution-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.range {
  width: 60px;
  font-size: 14px;
}

.count {
  width: 40px;
  text-align: right;
  font-size: 14px;
  color: #606266;
}

.text-danger {
  color: #f56c6c;
}
</style>
