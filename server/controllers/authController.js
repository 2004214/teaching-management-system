import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import { getPrivateKey } from '../utils/keys.js'
import { checkValidation } from '../utils/validation.js'
import { ok, okCreated, fail } from '../utils/response.js'

// 签发 RS256 JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    getPrivateKey(),
    {
      algorithm: 'RS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    }
  )
}

// 用户可见的公开字段 (剔除密码)
const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar
})

export const register = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { username, password, name, email, role } = req.body

  // 唯一性检查 (交给数据库约束兜底, 这里给出友好错误)
  const existing = await User.findOne({ where: { username } })
  if (existing) return fail(res, 400, '用户名已存在')

  const existingEmail = await User.findOne({ where: { email } })
  if (existingEmail) return fail(res, 400, '邮箱已存在')

  // 注册接口仅允许创建 student / teacher, 禁止外部提权到 admin
  const safeRole = role === 'teacher' ? 'teacher' : 'student'

  // 密码在 beforeCreate hook 里自动 argon2id 哈希
  const user = await User.create({ username, password, name, email, role: safeRole })

  const token = signToken(user)
  return okCreated(res, { token, user: publicUser(user) }, '注册成功')
}

export const login = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { username, password } = req.body

  // 显式带上 password 字段用于校验 (默认作用域排除)
  const user = await User.scope('withPassword').findOne({ where: { username } })
  if (!user) return fail(res, 401, '用户名或密码错误')

  // comparePassword 兼容 bcrypt 遗留哈希, 成功时自动升级到 argon2id
  const valid = await user.comparePassword(password)
  if (!valid) return fail(res, 401, '用户名或密码错误')

  const token = signToken(user)
  return ok(res, { token, user: publicUser(user) }, '登录成功')
}

export const getProfile = async (req, res) => {
  // authenticate 中间件已挂载 req.user (defaultScope 已过滤 password)
  return ok(res, { user: publicUser(req.user) })
}

export const updateProfile = async (req, res) => {
  const { name, email, avatar } = req.body
  const user = req.user

  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ where: { email } })
    if (existingEmail) return fail(res, 400, '邮箱已被使用')
  }

  if (name !== undefined) user.name = name
  if (email !== undefined) user.email = email
  if (avatar !== undefined) user.avatar = avatar
  await user.save()

  return ok(res, { user: publicUser(user) }, '更新成功')
}

export const changePassword = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { oldPassword, newPassword } = req.body

  // 需要密码字段, 走 withPassword 作用域
  const user = await User.scope('withPassword').findByPk(req.user.id)
  if (!user) return fail(res, 404, '用户不存在')

  const valid = await user.comparePassword(oldPassword)
  if (!valid) return fail(res, 400, '原密码错误')

  user.password = newPassword // beforeUpdate 会自动 argon2id 哈希
  await user.save()

  return ok(res, null, '密码修改成功')
}
