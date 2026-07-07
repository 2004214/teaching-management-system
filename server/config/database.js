import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'database.sqlite')

let db = null

export const initDatabase = async () => {
  try {
    const SQL = await initSqlJs()
    
    // 检查数据库文件是否存在
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH)
      db = new SQL.Database(fileBuffer)
    } else {
      db = new SQL.Database()
    }
    
    // 创建表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        avatar TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        teacherId INTEGER NOT NULL,
        semester TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacherId) REFERENCES users(id)
      )
    `)
    
    db.run(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        courseId INTEGER NOT NULL,
        studentId INTEGER NOT NULL,
        enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES courses(id),
        FOREIGN KEY (studentId) REFERENCES users(id),
        UNIQUE(courseId, studentId)
      )
    `)
    
    db.run(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        courseId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        deadline DATETIME NOT NULL,
        attachments TEXT DEFAULT '[]',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      )
    `)
    
    db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignmentId INTEGER NOT NULL,
        studentId INTEGER NOT NULL,
        content TEXT,
        files TEXT DEFAULT '[]',
        score REAL,
        feedback TEXT,
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        gradedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignmentId) REFERENCES assignments(id),
        FOREIGN KEY (studentId) REFERENCES users(id),
        UNIQUE(assignmentId, studentId)
      )
    `)
    
    db.run(`
      CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        courseId INTEGER NOT NULL,
        studentId INTEGER NOT NULL,
        assignmentId INTEGER NOT NULL,
        score REAL NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES courses(id),
        FOREIGN KEY (studentId) REFERENCES users(id),
        FOREIGN KEY (assignmentId) REFERENCES assignments(id)
      )
    `)
    
    db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        courseId INTEGER NOT NULL,
        studentId INTEGER NOT NULL,
        date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'present',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES courses(id),
        FOREIGN KEY (studentId) REFERENCES users(id)
      )
    `)
    
    // 保存数据库
    saveDatabase()
    
    console.log('数据库初始化成功')
    return db
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

export const getDatabase = () => {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

export const saveDatabase = () => {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  }
}

// 简单的查询执行器
export const executeQuery = (sql, params = []) => {
  const database = getDatabase()
  try {
    const stmt = database.prepare(sql)
    stmt.bind(params)
    
    const results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  } catch (error) {
    console.error('查询执行失败:', error)
    throw error
  }
}

// 执行插入/更新/删除
export const executeRun = (sql, params = []) => {
  const database = getDatabase()
  try {
    database.run(sql, params)
    saveDatabase()
    return { changes: database.getRowsModified(), lastId: database.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] }
  } catch (error) {
    console.error('执行失败:', error)
    throw error
  }
}

export default { initDatabase, getDatabase, saveDatabase, executeQuery, executeRun }
