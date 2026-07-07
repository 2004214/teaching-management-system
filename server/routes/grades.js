import express from 'express'
import { getGradesByCourse, getMyGrades, getCourseGradeStats } from '../controllers/gradeController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

// 学生查看自己的成绩
router.get('/mine', authenticate, authorize('student'), asyncHandler(getMyGrades))

// 教师/管理员按课程查看成绩
router.get('/course/:courseId', authenticate, authorize('teacher', 'admin'), asyncHandler(getGradesByCourse))

// 教师/管理员查看课程成绩统计
router.get('/course/:courseId/stats', authenticate, authorize('teacher', 'admin'), asyncHandler(getCourseGradeStats))

export default router
