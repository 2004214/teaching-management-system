// 统一响应格式: { code, message, data }
export const ok = (res, data = null, message = 'success', code = 0) => {
  return res.json({ code, message, data })
}

export const okCreated = (res, data = null, message = '创建成功') => {
  return res.status(201).json({ code: 0, message, data })
}

export const fail = (res, status = 400, message = '请求失败', code = -1) => {
  return res.status(status).json({ code, message, data: null })
}
