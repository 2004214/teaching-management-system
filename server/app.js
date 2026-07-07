import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './config/database.js'
import { initKeys } from './utils/keys.js'
import authRoutes from './routes/auth.js'
import courseRoutes from './routes/courses.js'
import assignmentRoutes from './routes/assignments.js'
import gradeRoutes from './routes/grades.js'
import attendanceRoutes from './routes/attendance.js'
import userRoutes from './routes/users.js'
import dashboardRoutes from './routes/dashboard.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

// 中间件
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// 静态文件 (上传目录)
app.use('/uploads', express.static('uploads'))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { uptime: process.uptime() } })
})

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/grades', gradeRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 404 兜底 (放在所有路由之后)
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null })
})

// 统一错误处理
app.use((err, req, res, next) => {
  // Sequelize 校验错误
  if (err?.name === 'SequelizeValidationError') {
    return res.status(400).json({
      code: 400,
      message: err.errors?.[0]?.message || '数据校验失败',
      data: null
    })
  }
  // Sequelize 唯一约束冲突
  if (err?.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      code: 400,
      message: err.errors?.[0]?.message || '数据已存在',
      data: null
    })
  }
  // Sequelize 外键约束
  if (err?.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      code: 400,
      message: '存在关联数据, 无法执行操作',
      data: null
    })
  }
  // JWT 错误
  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期', data: null })
  }

  console.error('未捕获错误:', err)
  res.status(500).json({ code: 500, message: '服务器错误', data: null })
})

// 启动服务器
const startServer = async () => {
  try {
    // 1. 初始化 RSA 密钥对 (首次启动自动生成)
    const { generated, privatePath, publicPath } = initKeys()
    if (generated) {
      console.log(`已生成 RSA 2048 密钥对: ${privatePath} / ${publicPath}`)
    }

    // 2. 初始化数据库 (含表同步 + 种子)
    await initDatabase()
    console.log('数据库初始化成功')

    // 3. 启动 HTTP 服务
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`)
      console.log(`允许的前端来源: ${CLIENT_ORIGIN}`)
    })
  } catch (error) {
    console.error('启动服务器失败:', error)
    process.exit(1)
  }
}

startServer()
