// 异步路由错误捕获: 把 async 函数抛出的错误转发到 Express 错误中间件
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
