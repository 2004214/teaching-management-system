<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>我的课程</span>
              <el-icon><Reading /></el-icon>
            </div>
          </template>
          <div class="stat-value">{{ stats.courses }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>待批改作业</span>
              <el-icon><Document /></el-icon>
            </div>
          </template>
          <div class="stat-value">{{ stats.pendingAssignments }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>待提交作业</span>
              <el-icon><Edit /></el-icon>
            </div>
          </template>
          <div class="stat-value">{{ stats.submittedAssignments }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>学生总数</span>
              <el-icon><User /></el-icon>
            </div>
          </template>
          <div class="stat-value">{{ stats.students }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近作业</span>
          </template>
          <el-table :data="recentAssignments" style="width: 100%">
            <el-table-column prop="title" label="作业标题" />
            <el-table-column prop="courseName" label="所属课程" />
            <el-table-column prop="deadline" label="截止时间" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最新通知</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(notification, index) in notifications"
              :key="index"
              :timestamp="notification.time"
              placement="top"
            >
              {{ notification.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const stats = ref({
  courses: 0,
  pendingAssignments: 0,
  submittedAssignments: 0,
  students: 0
})

const recentAssignments = ref([])
const notifications = ref([])

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    submitted: 'info',
    graded: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待提交',
    submitted: '已提交',
    graded: '已批改'
  }
  return texts[status] || status
}

onMounted(async () => {
  try {
    // 这里应该调用实际的API获取数据
    // 暂时使用模拟数据
    stats.value = {
      courses: 5,
      pendingAssignments: 3,
      submittedAssignments: 8,
      students: 120
    }
    
    recentAssignments.value = [
      {
        title: '数学作业第三章',
        courseName: '高等数学',
        deadline: '2026-07-10',
        status: 'pending'
      },
      {
        title: '英语作文',
        courseName: '大学英语',
        deadline: '2026-07-12',
        status: 'submitted'
      },
      {
        title: '物理实验报告',
        courseName: '大学物理',
        deadline: '2026-07-15',
        status: 'graded'
      }
    ]
    
    notifications.value = [
      {
        content: '高等数学课程发布了新作业',
        time: '2026-07-07 10:00'
      },
      {
        content: '大学英语作业截止时间延长至7月15日',
        time: '2026-07-06 15:30'
      },
      {
        content: '系统维护通知：7月10日凌晨2点进行系统升级',
        time: '2026-07-05 09:00'
      }
    ]
  } catch (error) {
    console.error('获取数据失败:', error)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  height: 150px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
  margin-top: 20px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
