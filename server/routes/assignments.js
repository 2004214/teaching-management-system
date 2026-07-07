import express from 'express'
import { body } from 'express-validator'
import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission
} from '../controllers/assignmentController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

router.get('/', authenticate, asyncHandler(getAssignments))
router.get('/:id', authenticate, asyncHandler(getAssignment))

router.post('/', authenticate, authorize('teacher', 'admin'), [
  body('courseId').notEmpty().withMessage('课程 ID 不能为空'),
  body('title').notEmpty().withMessage('作业标题不能为空'),
  body('deadline').notEmpty().withMessage('截止时间不能为空')
], asyncHandler(createAssignment))

router.put('/:id', authenticate, authorize('teacher', 'admin'), asyncHandler(updateAssignment))
router.delete('/:id', authenticate, authorize('teacher', 'admin'), asyncHandler(deleteAssignment))

router.post('/:id/submit', authenticate, authorize('student'), [
  body('content').notEmpty().withMessage('作业内容不能为空')
], asyncHandler(submitAssignment))

router.get('/:id/submissions', authenticate, authorize('teacher', 'admin'), asyncHandler(getSubmissions))

router.put('/submissions/:id/grade', authenticate, authorize('teacher', 'admin'), [
  body('score').isFloat({ min: 0, max: 100 }).withMessage('分数必须在 0-100 之间')
], asyncHandler(gradeSubmission))

export default router
