import { Op } from 'sequelize'
import {
  User,
  Course,
  Assignment,
  Submission,
  CourseEnrollment,
  Grade
} from '../models/index.js'
import { ok } from '../utils/response.js'

// 仪表盘: 根据角色返回不同的聚合数据
export const getDashboard = async (req, res) => {
  const role = req.user.role
  const uid = req.user.id
  const now = new Date()

  if (role === 'admin') {
    const [userCount, courseCount, assignmentCount, submissionCount] = await Promise.all([
      User.count(),
      Course.count(),
      Assignment.count(),
      Submission.count()
    ])
    const teacherCount = await User.count({ where: { role: 'teacher' } })
    const studentCount = await User.count({ where: { role: 'student' } })
    return ok(res, {
      data: {
        role,
        userCount,
        teacherCount,
        studentCount,
        courseCount,
        assignmentCount,
        submissionCount
      }
    })
  }

  if (role === 'teacher') {
    const courses = await Course.findAll({ where: { teacherId: uid }, attributes: ['id'] })
    const courseIds = courses.map(c => c.id)
    const [courseCount, assignmentCount, pendingCount] = await Promise.all([
      Course.count({ where: { teacherId: uid } }),
      Assignment.count({ where: { courseId: { [Op.in]: courseIds } } }),
      Submission.count({
        where: {
          gradedAt: null,
          assignmentId: {
            [Op.in]: (await Assignment.findAll({
              where: { courseId: { [Op.in]: courseIds } },
              attributes: ['id']
            })).map(a => a.id)
          }
        }
      })
    ])
    return ok(res, {
      data: {
        role,
        courseCount,
        assignmentCount,
        pendingGradeCount: pendingCount
      }
    })
  }

  // student
  const enrolled = await CourseEnrollment.findAll({
    where: { studentId: uid },
    attributes: ['courseId']
  })
  const courseIds = enrolled.map(e => e.courseId)

  const [courseCount, pendingAssignments, submissionCount, gradeCount] = await Promise.all([
    CourseEnrollment.count({ where: { studentId: uid } }),
    Assignment.count({
      where: {
        courseId: { [Op.in]: courseIds },
        deadline: { [Op.gt]: now },
        id: {
          [Op.notIn]: (await Submission.findAll({
            where: { studentId: uid },
            attributes: ['assignmentId']
          })).map(s => s.assignmentId)
        }
      }
    }),
    Submission.count({ where: { studentId: uid } }),
    Grade.count({ where: { studentId: uid } })
  ])

  return ok(res, {
    data: {
      role,
      enrolledCourseCount: courseCount,
      pendingAssignmentCount: pendingAssignments,
      submissionCount,
      gradeCount
    }
  })
}
