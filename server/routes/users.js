import express from 'express'
import { body } from 'express-validator'
import { listUsers, createUser, updateUser, resetPassword, deleteUser } from '../controllers/userController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

// 所有路由都要求 admin 角色
router.use(authenticate, authorize('admin'))

router.get('/', asyncHandler(listUsers))

router.post('/', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码长度不能少于 6 位'),
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确')
], asyncHandler(createUser))

router.put('/:id', asyncHandler(updateUser))
router.put('/:id/password', asyncHandler(resetPassword))
router.delete('/:id', asyncHandler(deleteUser))

export default router
