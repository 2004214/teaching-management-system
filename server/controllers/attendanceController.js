import { Op } from 'sequelize'
import { Attendance, Course, User, CourseEnrollment } from '../models/index.js'
import { checkValidation } from '../utils/validation.js'
import { ok, okCreated, fail } from '../utils/response.js'

// 教师/管理员: 按课程 + 日期录入/更新考勤 (批量 upsert)
export const recordAttendance = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { courseId, date, records } = req.body // records: [{ studentId, status, remark }]

  const course = await Course.findByPk(courseId)
  if (!course) return fail(res, 404, '课程不存在')

  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  if (!Array.isArray(records) || records.length === 0) {
    return fail(res, 400, '考勤记录不能为空')
  }

  // upsert 保证 UNIQUE(courseId, studentId, date) 幂等
  const results = []
  for (const r of records) {
    await Attendance.upsert({
      courseId,
      studentId: r.studentId,
      date,
      status: r.status,
      remark: r.remark || null
    })
    results.push({ studentId: r.studentId, status: r.status })
  }

  return okCreated(res, { count: results.length, records: results }, '考勤记录成功')
}

// 教师/管理员: 查询某课程某日考勤
export const getAttendanceByDate = async (req, res) => {
  const { courseId } = req.params
  const { date } = req.query

  const course = await Course.findByPk(courseId)
  if (!course) return fail(res, 404, '课程不存在')

  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  const where = { courseId }
  if (date) where.date = date

  const records = await Attendance.findAll({
    where,
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'username'] }],
    order: [['date', 'DESC']]
  })

  return ok(res, { data: records })
}

// 学生: 查看自己的考勤
export const getMyAttendance = async (req, res) => {
  const { courseId } = req.query

  const where = { studentId: req.user.id }
  if (courseId) where.courseId = courseId

  const records = await Attendance.findAll({
    where,
    include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
    order: [['date', 'DESC']]
  })

  return ok(res, { data: records })
}
