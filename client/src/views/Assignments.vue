<template>
  <div class="assignments">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>作业列表</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            发布作业
          </el-button>
        </div>
      </template>
      
      <el-table :data="assignments" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="作业标题" />
        <el-table-column prop="courseName" label="所属课程" />
        <el-table-column prop="deadline" label="截止时间" width="180" />
        <el-table-column prop="submissionCount" label="提交人数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewAssignment(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editAssignment(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAssignment(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑作业对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑作业' : '发布作业'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="作业标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入作业标题" />
        </el-form-item>
        <el-form-item label="作业描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入作业描述"
          />
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="form.deadline"
            type="datetime"
            placeholder="请选择截止时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            action="/api/upload"
            :on-success="handleUploadSuccess"
            :file-list="form.attachments"
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const router = useRouter()
const assignments = ref([])
const courses = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = ref({
  id: null,
  courseId: '',
  title: '',
  description: '',
  deadline: '',
  attachments: []
})

const rules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }]
}

const getStatusType = (status) => {
  const types = {
    active: 'success',
    expired: 'danger',
    draft: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    active: '进行中',
    expired: '已截止',
    draft: '草稿'
  }
  return texts[status] || status
}

const fetchAssignments = async () => {
  loading.value = true
  try {
    const response = await api.get('/assignments')
    assignments.value = response.data
  } catch (error) {
    console.error('获取作业列表失败:', error)
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

const showAddDialog = () => {
  isEdit.value = false
  form.value = {
    id: null,
    courseId: '',
    title: '',
    description: '',
    deadline: '',
    attachments: []
  }
  dialogVisible.value = true
}

const editAssignment = (assignment) => {
  isEdit.value = true
  form.value = { ...assignment }
  dialogVisible.value = true
}

const viewAssignment = (assignment) => {
  router.push(`/assignments/${assignment.id}`)
}

const deleteAssignment = async (assignment) => {
  try {
    await ElMessageBox.confirm('确定要删除这个作业吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await api.delete(`/assignments/${assignment.id}`)
    ElMessage.success('删除成功')
    fetchAssignments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除作业失败:', error)
    }
  }
}

const handleUploadSuccess = (response, file) => {
  form.value.attachments.push({
    name: file.name,
    url: response.data.url
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await api.put(`/assignments/${form.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/assignments', form.value)
      ElMessage.success('发布成功')
    }
    
    dialogVisible.value = false
    fetchAssignments()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchAssignments()
  fetchCourses()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
