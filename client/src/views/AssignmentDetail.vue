<template>
  <div class="assignment-detail" v-loading="loading">
    <el-card v-if="assignment">
      <template #header>
        <div class="card-header">
          <span>{{ assignment.title }}</span>
          <el-button @click="goBack">返回列表</el-button>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="作业标题">{{ assignment.title }}</el-descriptions-item>
        <el-descriptions-item label="所属课程">{{ assignment.courseName }}</el-descriptions-item>
        <el-descriptions-item label="截止时间">{{ assignment.deadline }}</el-descriptions-item>
        <el-descriptions-item label="提交人数">{{ assignment.submissionCount }}</el-descriptions-item>
        <el-descriptions-item label="作业描述" :span="2">
          {{ assignment.description || '暂无描述' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" class="mt-20">
        <el-tab-pane label="提交列表" name="submissions">
          <el-table :data="submissions" style="width: 100%">
            <el-table-column prop="studentName" label="学生姓名" />
            <el-table-column prop="studentId" label="学号" />
            <el-table-column prop="submittedAt" label="提交时间" width="180" />
            <el-table-column prop="score" label="分数" width="100">
              <template #default="{ row }">
                {{ row.score !== null ? row.score : '未批改' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewSubmission(row)">查看</el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="gradeSubmission(row)"
                  v-if="row.score === null"
                >
                  批改
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="提交作业" name="submit" v-if="isStudent">
          <el-form
            ref="submitFormRef"
            :model="submitForm"
            :rules="submitRules"
            label-width="100px"
          >
            <el-form-item label="作业内容" prop="content">
              <el-input
                v-model="submitForm.content"
                type="textarea"
                :rows="6"
                placeholder="请输入作业内容"
              />
            </el-form-item>
            <el-form-item label="附件">
              <el-upload
                action="/api/upload"
                :on-success="handleUploadSuccess"
                :file-list="submitForm.files"
              >
                <el-button size="small" type="primary">点击上传</el-button>
                <template #tip>
                  <div class="el-upload__tip">支持上传多个文件</div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
                提交作业
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 批改对话框 -->
    <el-dialog v-model="gradeDialogVisible" title="批改作业" width="500px">
      <el-form
        ref="gradeFormRef"
        :model="gradeForm"
        :rules="gradeRules"
        label-width="80px"
      >
        <el-form-item label="分数" prop="score">
          <el-input-number
            v-model="gradeForm.score"
            :min="0"
            :max="100"
            :precision="1"
          />
        </el-form-item>
        <el-form-item label="评语" prop="feedback">
          <el-input
            v-model="gradeForm.feedback"
            type="textarea"
            :rows="4"
            placeholder="请输入评语"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="gradeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleGrade" :loading="gradeLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import api from '../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const activeTab = ref('submissions')
const gradeDialogVisible = ref(false)
const submitLoading = ref(false)
const gradeLoading = ref(false)

const assignment = ref(null)
const submissions = ref([])
const currentSubmission = ref(null)

const isStudent = computed(() => userStore.user?.role === 'student')

const submitForm = ref({
  content: '',
  files: []
})

const gradeForm = ref({
  score: 0,
  feedback: ''
})

const submitRules = {
  content: [{ required: true, message: '请输入作业内容', trigger: 'blur' }]
}

const gradeRules = {
  score: [{ required: true, message: '请输入分数', trigger: 'blur' }]
}

const goBack = () => {
  router.push('/assignments')
}

const viewSubmission = (submission) => {
  // 查看提交详情
  console.log('查看提交:', submission)
}

const gradeSubmission = (submission) => {
  currentSubmission.value = submission
  gradeForm.value = {
    score: 0,
    feedback: ''
  }
  gradeDialogVisible.value = true
}

const handleUploadSuccess = (response, file) => {
  submitForm.value.files.push({
    name: file.name,
    url: response.data.url
  })
}

const handleSubmit = async () => {
  try {
    await submitFormRef.value.validate()
    submitLoading.value = true
    
    await api.post(`/assignments/${assignment.value.id}/submit`, submitForm.value)
    ElMessage.success('提交成功')
    fetchSubmissions()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleGrade = async () => {
  try {
    await gradeFormRef.value.validate()
    gradeLoading.value = true
    
    await api.put(`/submissions/${currentSubmission.value.id}/grade`, gradeForm.value)
    ElMessage.success('批改成功')
    gradeDialogVisible.value = false
    fetchSubmissions()
  } catch (error) {
    console.error('批改失败:', error)
  } finally {
    gradeLoading.value = false
  }
}

const fetchSubmissions = async () => {
  try {
    const response = await api.get(`/assignments/${assignment.value.id}/submissions`)
    submissions.value = response.data
  } catch (error) {
    console.error('获取提交列表失败:', error)
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const assignmentId = route.params.id
    // 这里应该调用实际的API获取数据
    // 暂时使用模拟数据
    assignment.value = {
      id: assignmentId,
      title: '数学作业第三章',
      courseName: '高等数学',
      deadline: '2026-07-10 23:59:59',
      submissionCount: 30,
      description: '完成第三章课后习题1-10题。'
    }
    
    submissions.value = [
      {
        id: 1,
        studentName: '李同学',
        studentId: '2026001',
        submittedAt: '2026-07-08 10:00:00',
        score: 85,
        content: '作业内容...',
        files: []
      },
      {
        id: 2,
        studentName: '王同学',
        studentId: '2026002',
        submittedAt: '2026-07-09 15:30:00',
        score: null,
        content: '作业内容...',
        files: []
      }
    ]
  } catch (error) {
    console.error('获取作业详情失败:', error)
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
</style>
