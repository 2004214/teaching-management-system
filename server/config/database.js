import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const {
  NODE_ENV = 'development',
  DATABASE_URL,
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_NAME = 'teaching_management',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  DB_DIALECT = 'postgres',
  DB_POOL_MAX = 10,
  DB_POOL_MIN = 0,
  DB_LOGGING = 'false',
  DB_SSL = 'false'
} = process.env

// 云端 PG (Neon / Supabase / Render PG) 通常要求 SSL
// 规则: 显式 DB_SSL=true, 或 生产环境用 DATABASE_URL 时默认启用
const needSSL = DB_SSL === 'true' || (NODE_ENV === 'production' && !!DATABASE_URL)

const commonOptions = {
  dialect: DB_DIALECT,
  logging: DB_LOGGING === 'true' ? console.log : false,
  pool: {
    max: parseInt(DB_POOL_MAX, 10),
    min: parseInt(DB_POOL_MIN, 10),
    acquire: 30000,
    idle: 10000
  },
  define: {
    // 全局约定: camelCase 字段, 自动 createdAt/updatedAt
    underscored: false,
    freezeTableName: false
  },
  ...(needSSL && {
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    }
  })
}

// 方式 A: DATABASE_URL 单一连接串 (推荐用于云端 Neon/Supabase/Render PG)
// 方式 B: DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD (本地开发)
export const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, commonOptions)
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: parseInt(DB_PORT, 10),
      ...commonOptions
    })

// 初始化数据库: 连接测试 + 表同步 + 种子数据
export const initDatabase = async () => {
  await sequelize.authenticate()

  // 触发模型 + 关联加载 (必须在 sync 前)
  await import('../models/index.js')

  // 生产环境不允许 alter (使用迁移工具), 开发环境允许结构漂移
  await sequelize.sync({ alter: NODE_ENV !== 'production' })

  // 种子数据 (仅在 users 表为空时创建默认账号)
  const { runSeed } = await import('../utils/seed.js')
  await runSeed()
}

export default { sequelize, initDatabase }
