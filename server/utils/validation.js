import { validationResult } from 'express-validator'

// express-validator 校验错误统一处理
export const checkValidation = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      code: 400,
      message: errors.array()[0].msg,
      data: { errors: errors.array() }
    })
    return false
  }
  return true
}
