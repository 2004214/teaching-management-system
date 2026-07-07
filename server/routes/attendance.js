import express from 'express'
import { body } from 'express-validator'
import { recordAttendance, getAttendanceByDate, getMyAttendance } from '../controllers/attendanceController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

// 录入/更新考勤 (教师/管理员)
router.post('/', authenticate, authorize('teacher', 'admin'), [
  body('courseId').notEmpty().withMessage('课程 ID 不能为空'),
  body('date').notEmpty().withMessage('日期不能为空'),
  body('records').isArray({ min: 1 }).withMessage('考勤记录不能为空')
], asyncHandler(recordAttendance))

// 查询课程考勤 (教师/管理员)
router.get('/course/:courseId', authenticate, authorize('teacher', 'admin'), asyncHandler(getAttendanceByDate))

// 学生查看自己的考勤
router.get('/mine', authenticate, authorize('student'), asyncHandler(getMyAttendance))

export default router
