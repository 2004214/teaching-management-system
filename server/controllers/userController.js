import { Op } from 'sequelize'
import { User } from '../models/index.js'
import { checkValidation } from '../utils/validation.js'
import { ok, okCreated, fail } from '../utils/response.js'
import { parsePagination, buildPageResult } from '../utils/paginate.js'

// 管理员: 用户管理

export const listUsers = async (req, res) => {
  const { page, pageSize, limit, offset } = parsePagination(req.query)
  const { role, keyword } = req.query

  const where = {}
  if (role) where.role = role
  if (keyword) {
    where[Op.or] = [
      { username: { [Op.like]: `%${keyword}%` } },
      { name: { [Op.like]: `%${keyword}%` } },
      { email: { [Op.like]: `%${keyword}%` } }
    ]
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  })

  return ok(res, buildPageResult(rows, count, page, pageSize))
}

export const createUser = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { username, password, name, email, role } = req.body

  const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } })
  if (existing) return fail(res, 400, '用户名或邮箱已存在')

  // 密码由 beforeCreate hook 自动 argon2id 哈希
  const user = await User.create({ username, password, name, email, role: role || 'student' })
  return okCreated(res, user, '用户创建成功')
}

export const updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.id)
  if (!user) return fail(res, 404, '用户不存在')

  const { name, email, role, avatar } = req.body

  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ where: { email } })
    if (existingEmail) return fail(res, 400, '邮箱已被使用')
  }

  if (name !== undefined) user.name = name
  if (email !== undefined) user.email = email
  if (role !== undefined) user.role = role
  if (avatar !== undefined) user.avatar = avatar
  await user.save()

  return ok(res, user, '用户更新成功')
}

export const resetPassword = async (req, res) => {
  const user = await User.findByPk(req.params.id)
  if (!user) return fail(res, 404, '用户不存在')

  const { newPassword } = req.body
  if (!newPassword || newPassword.length < 6) {
    return fail(res, 400, '新密码长度不能少于 6 位')
  }

  user.password = newPassword // beforeUpdate 会自动 argon2id 哈希
  await user.save()

  return ok(res, null, '密码重置成功')
}

export const deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id)
  if (!user) return fail(res, 404, '用户不存在')

  if (user.id === req.user.id) {
    return fail(res, 400, '不能删除自己')
  }

  // 教师身份存在 RESTRICT 关联, 有历史课程时删除会失败, 让 Sequelize 抛给错误中间件
  await user.destroy()
  return ok(res, null, '用户删除成功')
}
