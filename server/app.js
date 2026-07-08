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

// CORS: 支持多个来源 (Vercel 会为每个 PR / 分支生成 preview 域名)
// 使用逗号分隔的 CLIENT_ORIGIN, 例如: https://foo.vercel.app,https://bar.vercel.app
// 支持通配后缀: *.vercel.app 匹配所有 vercel 子域
const parseOrigins = (raw) => (raw || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const allowedOrigins = parseOrigins(process.env.CLIENT_ORIGIN)

const matchOrigin = (origin) => {
  if (!origin) return true // 允许 curl / 服务端到服务端 (无 Origin 头)
  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true
    if (allowed.startsWith('*.')) {
      const suffix = allowed.slice(1) // '.vercel.app'
      try {
        const host = new URL(origin).hostname
        return host === suffix.slice(1) || host.endsWith(suffix)
      } catch { return false }
    }
    return allowed === origin
  })
}

app.use(cors({
  origin: (origin, cb) => {
    if (matchOrigin(origin)) return cb(null, true)
    return cb(new Error(`CORS 拒绝来源: ${origin}`))
  },
  credentials: true
}))

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// 静态文件 (上传目录)
app.use('/uploads', express.static('uploads'))

// 健康检查 (Render 会周期性 ping /)
app.get('/', (req, res) => {
  res.json({ code: 0, message: 'teaching-management-system API', data: { status: 'ok' } })
})
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
  // CORS 拒绝
  if (err?.message?.startsWith('CORS 拒绝来源')) {
    return res.status(403).json({ code: 403, message: err.message, data: null })
  }
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
    // 1. 初始化 RSA 密钥对 (env / 文件, 首次启动可自动生成)
    const info = initKeys()
    if (info.generated) {
      console.log(`已生成 RSA 2048 密钥对: ${info.privatePath} / ${info.publicPath}`)
    } else {
      console.log(`RSA 密钥来源: ${info.source}`)
    }

    // 2. 初始化数据库 (含表同步 + 种子)
    await initDatabase()
    console.log('数据库初始化成功')

    // 3. 启动 HTTP 服务
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`)
      console.log(`允许的前端来源: ${allowedOrigins.join(', ')}`)
    })
  } catch (error) {
    console.error('启动服务器失败:', error)
    process.exit(1)
  }
}

startServer()
