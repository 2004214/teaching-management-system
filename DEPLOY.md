# 一键部署指南 (Neon + Render + Vercel 全免费)

本项目分三段部署:
- **数据库**: [Neon](https://neon.tech) — 免费 PostgreSQL (0.5 GB / 无限 branch)
- **后端 API**: [Render](https://render.com) — Web Service 免费实例 (冷启动 ~30s)
- **前端**: [Vercel](https://vercel.com) — 静态站点 + 全球 CDN

预计总耗时: 30 分钟

---

## 0. 准备工作

- 已有 GitHub 账号并把本仓库 push 上去 (本项目仓库: `2004214/teaching-management-system`)
- 本地 Node.js >= 18.17

---

## 1. 创建 Neon 数据库

1. 打开 https://neon.tech → **Sign up** (可用 GitHub 登录)
2. 新建 Project, 区域选 **AWS US East** 或 **Singapore** (离国内快)
3. 数据库名建议填 `teaching_management`
4. 进入 Dashboard → **Connection Details** → 点 **Show password** → 复制 **Connection string**

格式类似:
```
postgres://neondb_owner:xxx@ep-cool-xxx-pooler.us-east-2.aws.neon.tech/teaching_management?sslmode=require
```

**保存这条连接串, 后面 Render 需要用。**

---

## 2. 生成密钥 (本地执行一次)

在本地 clone 的仓库根目录:

```bash
cd server
npm install

# 生成字段加密密钥 (AES-256-GCM, 64 hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 例: a3f2e8...c9

# 生成 JWT RSA 密钥对 (base64 版, 便于粘贴到 env)
npm run keys:genb64
# 输出两行:
# JWT_PRIVATE_KEY_B64=LS0tLS1CRUdJTi...
# JWT_PUBLIC_KEY_B64=LS0tLS1CRUdJTi...
```

**把这三个值先记下来 (私钥不要泄露到公开渠道)。**

---

## 3. 部署后端到 Render

1. 打开 https://render.com → **Sign up with GitHub**
2. **New +** → **Web Service** → 授权你的 GitHub 仓库 → 选择 `teaching-management-system`
3. 填写:
   - **Name**: `teaching-management-api` (或你喜欢的)
   - **Region**: 建议 Singapore (国内访问快)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. 展开 **Advanced** → **Add Environment Variable**, 依次添加:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | 第 1 步的 Neon 连接串 |
   | `JWT_PRIVATE_KEY_B64` | 第 2 步生成的私钥 base64 |
   | `JWT_PUBLIC_KEY_B64` | 第 2 步生成的公钥 base64 |
   | `FIELD_ENCRYPTION_KEY` | 第 2 步生成的 64 位 hex |
   | `JWT_EXPIRES_IN` | `7d` |
   | `JWT_ISSUER` | `teaching-management-system` |
   | `JWT_AUDIENCE` | `teaching-management-client` |
   | `CLIENT_ORIGIN` | **暂时填** `*` (Vercel 部署完后回来改) |

5. 点 **Create Web Service** → 等 3~5 分钟, 直到日志出现:
   ```
   数据库初始化成功
   服务器运行在端口 10000
   ```
6. 记录后端域名, 类似: `https://teaching-management-api-xxxx.onrender.com`
7. 浏览器打开 `<后端域名>/api/health`, 应返回:
   ```json
   { "code": 0, "message": "ok", "data": { "uptime": ... } }
   ```

> **Render Free 冷启动**: 15 分钟无请求会休眠, 下次访问需要 30~50 秒唤醒。用户等一下即可, 或升级 $7/月 Starter 计划避免。

---

## 4. 部署前端到 Vercel

1. 打开 https://vercel.com → **Sign up with GitHub**
2. **Add New...** → **Project** → 选中 `teaching-management-system`
3. 填写:
   - **Framework Preset**: Vite (会自动识别)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (默认即可)
   - **Output Directory**: `dist`
4. 展开 **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | 第 3 步的 Render 后端域名 (**不要以 `/` 结尾**) |

5. 点 **Deploy** → 等 1~2 分钟

6. 部署完成后 Vercel 会给你一个域名, 类似:
   ```
   https://teaching-management-system.vercel.app
   ```

---

## 5. 回填 CORS 到 Render

1. 回到 Render Dashboard → 你的后端服务 → **Environment**
2. 修改 `CLIENT_ORIGIN` 的值, 从 `*` 改为具体的 Vercel 域名 + 通配符:
   ```
   https://teaching-management-system.vercel.app,https://*.vercel.app
   ```
   > 加 `*.vercel.app` 是让 PR 预览域名也能访问 API
3. **Save Changes** → Render 会自动重启服务 (约 30 秒)

---

## 6. 验证部署

打开 Vercel 域名 (例如 `https://teaching-management-system.vercel.app`), 用种子账号登录:

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |
| 教师 | `teacher01` | `teacher123` |
| 学生 | `student01` | `student123` |

**登录后立即在管理端修改默认密码。**

---

## 7. 常见问题

### Q: Render 后端启动失败, 报 `SequelizeConnectionError`
检查 `DATABASE_URL` 是否带了 `?sslmode=require`。Neon 强制要求 SSL。

### Q: 登录后所有请求都是 CORS 错误
`CLIENT_ORIGIN` 没写对。查看 Render Logs → 应该能看到 `CORS 拒绝来源: xxx`, 把那个 origin 加进去。

### Q: 冷启动太慢
- 免费方案就是这样, 可用 UptimeRobot 每 10 分钟 ping 一次 `/api/health` 保活
- 或升级 Render Starter $7/月

### Q: 想换其他云 PG
只要能给你一条 `postgres://` 连接串就行, 支持:
- [Supabase](https://supabase.com) — 免费 500 MB
- [Aiven](https://aiven.io) — 30 天试用
- [Railway](https://railway.app) — $5 免费额度/月

### Q: 首次登录报 500 / 密码校验失败
Free 实例第一次冷启动时数据库还在同步表结构。等 10 秒重试, 或看 Render Logs 确认 `数据库初始化成功` 已打印。

---

## 8. 后续更新流程

```bash
git add .
git commit -m "feat: xxx"
git push origin main
```

- **Render** 自动检测 push, 重新 build & deploy 后端 (~3 分钟)
- **Vercel** 自动检测 push, 重新 build & deploy 前端 (~1 分钟)

---

## 9. 关闭 / 清理

- **暂停 Render**: Dashboard → Settings → **Suspend Service** (免费实例本来就休眠, 可以不管)
- **删除 Neon**: Neon Console → Project Settings → **Delete Project**
- **删除 Vercel**: Vercel Dashboard → Project → Settings → **Delete Project**
