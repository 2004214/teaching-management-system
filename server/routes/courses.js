import express from 'express'
import { body } from 'express-validator'
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse
} from '../controllers/courseController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

router.get('/', authenticate, asyncHandler(getCourses))
router.get('/:id', authenticate, asyncHandler(getCourse))

router.post('/', authenticate, authorize('teacher', 'admin'), [
  body('name').notEmpty().withMessage('课程名称不能为空')
], asyncHandler(createCourse))

router.put('/:id', authenticate, authorize('teacher', 'admin'), asyncHandler(updateCourse))
router.delete('/:id', authenticate, authorize('teacher', 'admin'), asyncHandler(deleteCourse))

router.post('/:id/enroll', authenticate, authorize('student'), asyncHandler(enrollCourse))
router.delete('/:id/enroll', authenticate, authorize('student'), asyncHandler(unenrollCourse))

export default router
