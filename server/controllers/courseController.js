import { Op } from 'sequelize'
import { Course, User, CourseEnrollment } from '../models/index.js'
import { checkValidation } from '../utils/validation.js'
import { ok, okCreated, fail } from '../utils/response.js'
import { parsePagination, buildPageResult } from '../utils/paginate.js'

// 教师视角的作品数附加
const teacherAttrs = [{ model: User, as: 'teacher', attributes: ['id', 'name'] }]

export const getCourses = async (req, res) => {
  const { page, pageSize, limit, offset } = parsePagination(req.query)

  const where = {}
  const include = [...teacherAttrs]

  if (req.user.role === 'teacher') {
    where.teacherId = req.user.id
  }

  // 学生: 只看已选课程
  if (req.user.role === 'student') {
    include.push({
      model: User,
      as: 'students',
      attributes: ['id'],
      through: { attributes: [] },
      where: { id: req.user.id },
      required: true
    })
  }

  const { rows, count } = await Course.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true
  })

  // 附加学生数
  const withCount = await Promise.all(rows.map(async (c) => {
    const studentCount = await CourseEnrollment.count({ where: { courseId: c.id } })
    return { ...c.toJSON(), teacherName: c.teacher?.name, studentCount }
  }))

  return ok(res, buildPageResult(withCount, count, page, pageSize))
}

export const getCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name'] },
      { model: User, as: 'students', attributes: ['id', 'name', 'email'], through: { attributes: ['enrolledAt'] } }
    ]
  })

  if (!course) return fail(res, 404, '课程不存在')

  const data = {
    ...course.toJSON(),
    teacherName: course.teacher?.name,
    studentCount: course.students?.length || 0
  }

  return ok(res, { data })
}

export const createCourse = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { name, description, semester } = req.body
  const course = await Course.create({
    name,
    description,
    semester,
    teacherId: req.user.id
  })
  return okCreated(res, course, '课程创建成功')
}

export const updateCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id)
  if (!course) return fail(res, 404, '课程不存在')

  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  const { name, description, semester } = req.body
  if (name !== undefined) course.name = name
  if (description !== undefined) course.description = description
  if (semester !== undefined) course.semester = semester
  await course.save()

  return ok(res, course, '课程更新成功')
}

export const deleteCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id)
  if (!course) return fail(res, 404, '课程不存在')

  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  // 关联删除由 onDelete CASCADE 处理 (assignments / grades / attendances)
  // 选课表在 sequelize 关联中已配置, destroy 会级联
  await course.destroy()
  return ok(res, null, '课程删除成功')
}

export const enrollCourse = async (req, res) => {
  const courseId = req.params.id
  const studentId = req.user.id

  const course = await Course.findByPk(courseId)
  if (!course) return fail(res, 404, '课程不存在')

  const existing = await CourseEnrollment.findOne({ where: { courseId, studentId } })
  if (existing) return fail(res, 400, '已选该课程')

  await CourseEnrollment.create({ courseId, studentId })
  return ok(res, null, '选课成功')
}

export const unenrollCourse = async (req, res) => {
  const courseId = req.params.id
  const studentId = req.user.id

  const deleted = await CourseEnrollment.destroy({ where: { courseId, studentId } })
  if (deleted === 0) return fail(res, 404, '未选该课程')

  return ok(res, null, '退课成功')
}
