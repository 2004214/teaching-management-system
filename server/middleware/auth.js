import jwt from 'jsonwebtoken'
import { getPublicKey } from '../utils/keys.js'
import { User } from '../models/index.js'

// JWT 认证 (RS256 公钥验签)
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ code: 401, message: '未提供认证令牌', data: null })
    }

    const decoded = jwt.verify(token, getPublicKey(), {
      algorithms: ['RS256'],
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    })

    const user = await User.findByPk(decoded.id)
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在', data: null })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ code: 401, message: '认证失败', data: null })
  }
}

// 角色授权
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '权限不足', data: null })
    }
    next()
  }
}
