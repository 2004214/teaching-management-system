import { Op } from 'sequelize'
import { Grade, User, Course, Assignment, CourseEnrollment } from '../models/index.js'
import { ok, fail } from '../utils/response.js'

// 教师/管理员: 按课程查看全班成绩
export const getGradesByCourse = async (req, res) => {
  const courseId = req.params.courseId

  const course = await Course.findByPk(courseId)
  if (!course) return fail(res, 404, '课程不存在')

  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  const grades = await Grade.findAll({
    where: { courseId },
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'username'] },
      { model: Assignment, as: 'assignment', attributes: ['id', 'title'] }
    ],
    order: [['createdAt', 'DESC']]
  })

  return ok(res, { data: grades })
}

// 学生: 查看自己的成绩
export const getMyGrades = async (req, res) => {
  const studentId = req.user.id

  const grades = await Grade.findAll({
    where: { studentId },
    include: [
      { model: Course, as: 'course', attributes: ['id', 'name'] },
      { model: Assignment, as: 'assignment', attributes: ['id', 'title'] }
    ],
    order: [['createdAt', 'DESC']]
  })

  return ok(res, { data: grades })
}

// 教师/管理员: 课程成绩统计 (平均/最高/最低/及格率)
export const getCourseGradeStats = async (req, res) => {
  const courseId = req.params.courseId

  const course = await Course.findByPk(courseId)
  if (!course) return fail(res, 404, '课程不存在')

  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  const grades = await Grade.findAll({ where: { courseId } })
  if (grades.length === 0) {
    return ok(res, { data: { count: 0, avg: 0, max: 0, min: 0, passRate: 0 } })
  }

  const scores = grades.map(g => Number(g.score))
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const max = Math.max(...scores)
  const min = Math.min(...scores)
  const passCount = scores.filter(s => s >= 60).length
  const passRate = (passCount / scores.length) * 100

  return ok(res, {
    data: {
      count: scores.length,
      avg: Math.round(avg * 100) / 100,
      max,
      min,
      passRate: Math.round(passRate * 100) / 100
    }
  })
}
