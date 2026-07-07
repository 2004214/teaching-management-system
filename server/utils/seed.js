import { User } from '../models/index.js'

// 初始种子数据: 仅在 users 表为空时创建
export const runSeed = async () => {
  const count = await User.count()
  if (count > 0) {
    console.log(`跳过种子数据 (已有 ${count} 个用户)`)
    return
  }

  console.log('执行种子数据: 创建默认账号...')

  await User.bulkCreate([
    {
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      email: 'admin@example.com',
      role: 'admin'
    },
    {
      username: 'teacher01',
      password: 'teacher123',
      name: '示例教师',
      email: 'teacher01@example.com',
      role: 'teacher'
    },
    {
      username: 'student01',
      password: 'student123',
      name: '示例学生',
      email: 'student01@example.com',
      role: 'student'
    }
  ], { individualHooks: true })

  console.log('种子数据创建完成:')
  console.log('  管理员: admin / admin123')
  console.log('  教师:   teacher01 / teacher123')
  console.log('  学生:   student01 / student123')
}
