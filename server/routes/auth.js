import express from 'express'
import { body } from 'express-validator'
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

// 注册
router.post('/register', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码长度不能少于 6 位'),
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确')
], asyncHandler(register))

// 登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], asyncHandler(login))

// 获取个人信息
router.get('/profile', authenticate, asyncHandler(getProfile))

// 更新个人信息
router.put('/profile', authenticate, asyncHandler(updateProfile))

// 修改密码
router.put('/password', authenticate, [
  body('oldPassword').notEmpty().withMessage('原密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码长度不能少于 6 位')
], asyncHandler(changePassword))

export default router
