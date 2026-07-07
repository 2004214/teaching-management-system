<template>
  <div class="course-detail" v-loading="loading">
    <el-card v-if="course">
      <template #header>
        <div class="card-header">
          <span>{{ course.name }}</span>
          <el-button @click="goBack">返回列表</el-button>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="课程名称">{{ course.name }}</el-descriptions-item>
        <el-descriptions-item label="授课教师">{{ course.teacherName }}</el-descriptions-item>
        <el-descriptions-item label="学期">{{ course.semester }}</el-descriptions-item>
        <el-descriptions-item label="学生人数">{{ course.studentCount }}</el-descriptions-item>
        <el-descriptions-item label="课程描述" :span="2">
          {{ course.description || '暂无描述' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" class="mt-20">
        <el-tab-pane label="作业列表" name="assignments">
          <el-table :data="assignments" style="width: 100%">
            <el-table-column prop="title" label="作业标题" />
            <el-table-column prop="deadline" label="截止时间" width="180" />
            <el-table-column prop="submissionCount" label="提交人数" width="100" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewAssignment(row)">查看</el-button>
                <el-button size="small" type="primary" @click="editAssignment(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="学生列表" name="students">
          <el-table :data="students" style="width: 100%">
            <el-table-column prop="studentId" label="学号" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="enrolledAt" label="选课时间" width="180" />
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="成绩统计" name="grades">
          <div class="grade-stats">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="平均分" :value="gradeStats.average" :precision="1" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="最高分" :value="gradeStats.max" :precision="1" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="最低分" :value="gradeStats.min" :precision="1" />
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const activeTab = ref('assignments')

const course = ref(null)
const assignments = ref([])
const students = ref([])
const gradeStats = ref({
  average: 0,
  max: 0,
  min: 0
})

const goBack = () => {
  router.push('/courses')
}

const viewAssignment = (assignment) => {
  router.push(`/assignments/${assignment.id}`)
}

const editAssignment = (assignment) => {
  // 编辑作业逻辑
  console.log('编辑作业:', assignment)
}

onMounted(async () => {
  loading.value = true
  try {
    const courseId = route.params.id
    // 这里应该调用实际的API获取数据
    // 暂时使用模拟数据
    course.value = {
      id: courseId,
      name: '高等数学',
      teacherName: '张教授',
      semester: '2026-2027第一学期',
      studentCount: 45,
      description: '高等数学课程，涵盖微积分、线性代数等内容。'
    }
    
    assignments.value = [
      {
        id: 1,
        title: '数学作业第三章',
        deadline: '2026-07-10 23:59:59',
        submissionCount: 30
      },
      {
        id: 2,
        title: '数学作业第四章',
        deadline: '2026-07-17 23:59:59',
        submissionCount: 0
      }
    ]
    
    students.value = [
      {
        studentId: '2026001',
        name: '李同学',
        email: 'li@example.com',
        enrolledAt: '2026-07-01 10:00:00'
      },
      {
        studentId: '2026002',
        name: '王同学',
        email: 'wang@example.com',
        enrolledAt: '2026-07-01 10:05:00'
      }
    ]
    
    gradeStats.value = {
      average: 85.5,
      max: 98,
      min: 62
    }
  } catch (error) {
    console.error('获取课程详情失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mt-20 {
  margin-top: 20px;
}

.grade-stats {
  padding: 20px;
}
</style>
