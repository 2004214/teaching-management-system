# 一键部署指南 (GitHub Pages + Render + Neon, 全免费)

本项目分三段部署:
- **前端** → GitHub Pages (`https://<user>.github.io/teaching-management-system/`)
- **后端 API** → [Render](https://render.com) Web Service 免费实例 (冷启动 ~30s)
- **数据库** → [Neon](https://neon.tech) 免费 PostgreSQL (0.5 GB)

预计耗时: 25 分钟, 全程不用改代码, 只需要在网页上点点点 + 粘 env。

最终效果: 打开 https://2004214.github.io/teaching-management-system/ 就能直接用。

---

## 0. 准备

- 本仓库已 push 到 GitHub
- 本地 Node.js >= 18.17
- 一个 Neon 账号 + Render 账号 (都可用 GitHub 登录)

---

## 1. 创建 Neon 数据库 (2 分钟)

1. https://neon.tech → **Sign up with GitHub**
2. 新建 Project, 区域 **AWS Singapore** 或 **US East** 都行
3. 数据库名填 `teaching_management`
4. Dashboard → **Connection Details** → 点 **Show password** → 复制 **Connection string**

得到类似:
```
postgres://neondb_owner:xxxxx@ep-cool-xxx-pooler.us-east-2.aws.neon.tech/teaching_management?sslmode=require
```

**保存这条连接串, 后面 Render 要用。**

---

## 2. 本地生成密钥 (3 分钟, 一次性)

在本地 clone 的仓库根:

```bash
cd server
npm install

# 字段加密密钥 (AES-256-GCM, 64 hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 输出例: a3f2e8b1c9...c9  (记下这个值 = FIELD_ENCRYPTION_KEY)

# JWT RSA 密钥对 (base64 版, 便于粘到 env)
npm run keys:genb64
# 输出两行:
# JWT_PRIVATE_KEY_B64=LS0tLS1CRUdJTi...
# JWT_PUBLIC_KEY_B64=LS0tLS1CRUdJTi...
```

**把这三个值先保存到记事本 (私钥不要贴到任何公开地方)。**

---

## 3. 部署后端到 Render (10 分钟)

1. https://render.com → **Sign up with GitHub**
2. **New +** → **Web Service** → 授权 GitHub → 选 `teaching-management-system` 仓库
3. 填:
   - **Name**: `teaching-management-api`
   - **Region**: Singapore (国内快)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. 展开 **Advanced** → **Add Environment Variable**, 逐条添加:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | 第 1 步的 Neon 连接串 (含 `?sslmode=require`) |
   | `JWT_PRIVATE_KEY_B64` | 第 2 步生成的私钥 base64 |
   | `JWT_PUBLIC_KEY_B64` | 第 2 步生成的公钥 base64 |
   | `FIELD_ENCRYPTION_KEY` | 第 2 步生成的 64 hex |
   | `JWT_EXPIRES_IN` | `7d` |
   | `JWT_ISSUER` | `teaching-management-system` |
   | `JWT_AUDIENCE` | `teaching-management-client` |
   | `CLIENT_ORIGIN` | **暂时填** `*` (Pages 上线后回来改) |

5. 点 **Create Web Service** → 等 3~5 分钟, 日志出现:
   ```
   数据库初始化成功
   服务器运行在端口 10000
   ```
6. 记下后端域名, 类似 `https://teaching-management-api-xxxx.onrender.com`
7. 浏览器打开 `<后端域名>/api/health`, 应返回 JSON `{"code":0, "message":"ok", ...}`

---

## 4. 部署前端到 GitHub Pages (5 分钟)

### 4.1 在仓库中启用 Pages

1. 打开你的仓库 https://github.com/2004214/teaching-management-system
2. **Settings** → 左侧 **Pages**
3. **Source** 选 **GitHub Actions** (⚠️ 不要选 Deploy from a branch)
4. 保存

### 4.2 配置后端 API 地址

- 方式 A (推荐, 不改代码): 在仓库 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
  - Name: `VITE_API_BASE_URL`
  - Value: 第 3 步得到的 Render 后端地址 (例 `https://teaching-management-api-xxxx.onrender.com`, **不要以 `/` 结尾, 不要带 `/api`**)

- 方式 B: 直接改 `client/.env.production` 里的 `VITE_API_BASE_URL` 然后提交

### 4.3 触发部署

任何 push 到 `main` 分支且改动了 `client/**` 都会自动触发。第一次手动触发:

1. 仓库 **Actions** 标签
2. 左侧选 **Deploy client to GitHub Pages**
3. 右上 **Run workflow** → 选 `main` → **Run workflow**
4. 等 2~3 分钟, workflow 变绿

### 4.4 访问站点

Pages 地址: `https://2004214.github.io/teaching-management-system/`

第一次打开可能白屏 30 秒, 因为 Render 冷启动, 后端还在唤醒中。等一下再刷新。

---

## 5. 回填 CORS 到 Render (1 分钟)

1. Render Dashboard → 你的后端 → **Environment**
2. 修改 `CLIENT_ORIGIN`, 从 `*` 改为具体域名:
   ```
   https://2004214.github.io
   ```
   > 注意: 只写到域名, 不带 `/teaching-management-system/` 路径
3. **Save Changes** → Render 自动重启 (约 30 秒)

---

## 6. 验证

打开 `https://2004214.github.io/teaching-management-system/`, 用种子账号:

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |
| 教师 | `teacher01` | `teacher123` |
| 学生 | `student01` | `student123` |

**登录后立即修改默认密码, 别偷懒!**

---

## 7. 常见问题

### Q: Pages 显示 404
- **Settings → Pages** 里 Source 必须选 **GitHub Actions**, 不是 branch
- Actions workflow 是否绿色? 红色的看日志
- 是否等了 1~2 分钟让 CDN 生效?

### Q: Pages 站点空白 / 资源 404
- `client/.env.production` 或 workflow 里 `VITE_BASE_URL` 必须等于 `/<repo-name>/`, 本仓库是 `/teaching-management-system/`
- 如果你 fork 后改了 repo 名, 记得同步改

### Q: 登录报 CORS 错误
- Render 环境变量 `CLIENT_ORIGIN` 只写域名, 不带路径 (对 `https://2004214.github.io`, 不写 `/teaching-management-system/`)
- 改完后 Render 会自动重启, 等 30 秒

### Q: 登录报网络错误
- 后端还在冷启动 (免费实例休眠), 等 30~50 秒重试
- 打开 `<Render 域名>/api/health` 看是否返回 200

### Q: 冷启动太慢体验差
- 用 [UptimeRobot](https://uptimerobot.com) 免费监控每 5 分钟 ping 一次 `<Render 域名>/api/health` 保活
- 或升级 Render Starter $7/月

### Q: 想换其他免费 PG
只要给一条 `postgres://` 连接串就行:
- [Supabase](https://supabase.com) — 免费 500 MB
- [Aiven](https://aiven.io) — 30 天试用
- [Railway](https://railway.app) — $5 免费额度/月

---

## 8. 后续更新

```bash
git add .
git commit -m "feat: xxx"
git push origin main
```

- 改 `server/**` → **Render** 自动重建后端 (~3 分钟)
- 改 `client/**` → **GitHub Actions** 自动重建前端并部署 Pages (~2 分钟)

---

## 9. 自定义域名 (可选)

如果你有自己的域名 (例如 `edu.example.com`):

1. DNS 加一条 `CNAME` 指向 `2004214.github.io`
2. GitHub 仓库 Settings → Pages → **Custom domain** 填入
3. `client/.env.production` 里把 `VITE_BASE_URL` 改成 `/`
4. Render 的 `CLIENT_ORIGIN` 改成 `https://edu.example.com`
5. 重新 push 触发部署
