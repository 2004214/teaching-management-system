import { Op } from 'sequelize'
import {
  Assignment,
  Course,
  Submission,
  Grade,
  User,
  CourseEnrollment,
  sequelize
} from '../models/index.js'
import { checkValidation } from '../utils/validation.js'
import { ok, okCreated, fail } from '../utils/response.js'
import { parsePagination, buildPageResult } from '../utils/paginate.js'

// 输出 DTO: 附加课程名、提交数、状态
const toDTO = async (assignment) => {
  const submissionCount = await Submission.count({ where: { assignmentId: assignment.id } })
  return {
    ...assignment.toJSON(),
    courseName: assignment.course?.name,
    submissionCount,
    status: assignment.getStatus()
  }
}

export const getAssignments = async (req, res) => {
  const { page, pageSize, limit, offset } = parsePagination(req.query)
  const { courseId } = req.query

  const where = {}
  if (courseId) where.courseId = courseId

  // 学生: 只看已选课程的作业
  if (req.user.role === 'student') {
    const enrolled = await CourseEnrollment.findAll({
      where: { studentId: req.user.id },
      attributes: ['courseId']
    })
    where.courseId = { [Op.in]: enrolled.map(e => e.courseId) }
  }

  // 教师: 只看自己课程的作业
  if (req.user.role === 'teacher') {
    const myCourses = await Course.findAll({
      where: { teacherId: req.user.id },
      attributes: ['id']
    })
    where.courseId = { [Op.in]: myCourses.map(c => c.id) }
  }

  const { rows, count } = await Assignment.findAndCountAll({
    where,
    include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  })

  const data = await Promise.all(rows.map(toDTO))
  return ok(res, buildPageResult(data, count, page, pageSize))
}

export const getAssignment = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id, {
    include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }]
  })
  if (!assignment) return fail(res, 404, '作业不存在')

  const data = await toDTO(assignment)
  return ok(res, { data })
}

export const createAssignment = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { courseId, title, description, deadline, attachments } = req.body

  const course = await Course.findByPk(courseId)
  if (!course) return fail(res, 404, '课程不存在')

  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  const assignment = await Assignment.create({
    courseId,
    title,
    description,
    deadline,
    attachments: attachments || []
  })

  return okCreated(res, assignment, '作业发布成功')
}

export const updateAssignment = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id)
  if (!assignment) return fail(res, 404, '作业不存在')

  const course = await Course.findByPk(assignment.courseId)
  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  const { title, description, deadline, attachments } = req.body
  if (title !== undefined) assignment.title = title
  if (description !== undefined) assignment.description = description
  if (deadline !== undefined) assignment.deadline = deadline
  if (attachments !== undefined) assignment.attachments = attachments
  await assignment.save()

  return ok(res, assignment, '作业更新成功')
}

export const deleteAssignment = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id)
  if (!assignment) return fail(res, 404, '作业不存在')

  const course = await Course.findByPk(assignment.courseId)
  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  // 关联 submission / grade 由 onDelete CASCADE 处理
  await assignment.destroy()
  return ok(res, null, '作业删除成功')
}

export const submitAssignment = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { content, files } = req.body
  const assignmentId = req.params.id
  const studentId = req.user.id

  const assignment = await Assignment.findByPk(assignmentId)
  if (!assignment) return fail(res, 404, '作业不存在')

  if (new Date(assignment.deadline) < new Date()) {
    return fail(res, 400, '作业已过截止时间')
  }

  const existing = await Submission.findOne({ where: { assignmentId, studentId } })
  if (existing) return fail(res, 400, '已提交过该作业')

  // content 是 VIRTUAL, set 时自动 AES-256-GCM 加密写入 contentCipher
  const submission = await Submission.create({
    assignmentId,
    studentId,
    content,
    files: files || []
  })

  return okCreated(res, {
    id: submission.id,
    assignmentId,
    studentId,
    content,
    files: submission.files
  }, '作业提交成功')
}

export const getSubmissions = async (req, res) => {
  const assignmentId = req.params.id

  const assignment = await Assignment.findByPk(assignmentId)
  if (!assignment) return fail(res, 404, '作业不存在')

  const course = await Course.findByPk(assignment.courseId)
  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  const submissions = await Submission.findAll({
    where: { assignmentId },
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'username'] }],
    order: [['submittedAt', 'DESC']]
  })

  // content 通过 VIRTUAL getter 自动解密
  const data = submissions.map(s => ({
    ...s.toJSON(),
    content: s.content,
    studentName: s.student?.name,
    studentUsername: s.student?.username
  }))

  return ok(res, { data })
}

export const gradeSubmission = async (req, res) => {
  if (!checkValidation(req, res)) return

  const { score, feedback } = req.body
  const submissionId = req.params.id

  const submission = await Submission.findByPk(submissionId)
  if (!submission) return fail(res, 404, '提交不存在')

  const assignment = await Assignment.findByPk(submission.assignmentId)
  const course = await Course.findByPk(assignment.courseId)
  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return fail(res, 403, '权限不足')
  }

  // 事务: 更新 submission + upsert grade (避免重复评分产生多条记录)
  await sequelize.transaction(async (t) => {
    submission.score = score
    submission.feedback = feedback
    submission.gradedAt = new Date()
    await submission.save({ transaction: t })

    await Grade.upsert({
      courseId: assignment.courseId,
      studentId: submission.studentId,
      assignmentId: assignment.id,
      score
    }, { transaction: t })
  })

  return ok(res, null, '批改成功')
}
