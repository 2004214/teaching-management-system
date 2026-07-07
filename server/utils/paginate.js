// 分页参数解析 + 结果封装
export const parsePagination = (query, { defaultPageSize = 10, maxPageSize = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1)
  let pageSize = parseInt(query.pageSize) || defaultPageSize
  pageSize = Math.min(Math.max(1, pageSize), maxPageSize)
  const offset = (page - 1) * pageSize
  return { page, pageSize, limit: pageSize, offset }
}

export const buildPageResult = (rows, total, page, pageSize) => ({
  data: rows,
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize)
})
