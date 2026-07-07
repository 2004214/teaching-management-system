# 教学管理系统 (Teaching Management System)

一个基于 **Vue 3 + Node.js + PostgreSQL** 的全栈教学管理系统, 支持教师、学生、管理员三种角色, 覆盖课程、作业、成绩、考勤全流程。项目内置多层加密体系保障用户数据安全。

## 功能特性

### 三种角色
- **管理员**: 用户管理、全局数据看板
- **教师**: 创建课程、发布作业、批改提交、录入考勤、查看成绩统计
- **学生**: 选课/退课、提交作业、查看成绩与考勤

### 核心模块
- 认证与授权 (JWT RS256 + 角色权限)
- 课程与选课
- 作业发布 / 提交 / 批改
- 成绩记录与统计
- 考勤管理
- 仪表盘

### 安全设计
- **密码哈希**: argon2id (默认), 兼容遗留 bcrypt 哈希, 登录成功自动升级
- **JWT**: RS256 非对称签名 (首次启动自动生成 RSA 2048 密钥对, 私钥权限 0600)
- **敏感字段加密**: 作业提交内容 (`Submission.content`) 使用 AES-256-GCM, 通过 Sequelize VIRTUAL 字段透明加解密
- **.env 加密工具**: 内置 `bin/env-crypt.js`, 使用 AES-256-GCM + `MASTER_KEY` 加解密整个 `.env` 文件

## 技术栈

### 前端 (`client/`)
- Vue 3 + Vite
- Element Plus
- Pinia (状态管理)
- Vue Router
- Axios

### 后端 (`server/`)
- Node.js + Express
- Sequelize ORM + PostgreSQL
- jsonwebtoken (RS256)
- argon2 / bcryptjs (兼容)
- express-validator
- multer (文件上传)

## 目录结构

```
教学管理系统/
├── client/                   # Vue 3 前端
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/                   # Express 后端
│   ├── app.js                # 应用入口
│   ├── config/
│   │   └── database.js       # Sequelize 实例 + initDatabase
│   ├── models/               # 数据模型 + 关联
│   ├── controllers/          # 业务逻辑
│   ├── routes/               # 路由定义
│   ├── middleware/
│   │   └── auth.js           # JWT 认证 + 角色授权
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── crypto.js         # AES-256-GCM 字段加密
│   │   ├── keys.js           # RSA 密钥管理
│   │   ├── passwordHasher.js # argon2id + bcrypt 兼容
│   │   ├── paginate.js
│   │   ├── response.js
│   │   ├── seed.js           # 种子数据
│   │   └── validation.js
│   ├── bin/
│   │   └── env-crypt.js      # .env 加解密 CLI
│   ├── keys/                 # RSA 密钥对 (自动生成, 私钥不入库)
│   ├── .env.example
│   └── package.json
├── uploads/                  # 上传文件目录
└── .gitignore
```

## 快速开始

### 1. 安装 PostgreSQL

```bash
# 需要一个可访问的 PostgreSQL 数据库
createdb teaching_management
```

### 2. 后端

```bash
cd server
npm install
cp .env.example .env
# 生成字段加密密钥 (64 字符 hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 将输出写入 .env 的 FIELD_ENCRYPTION_KEY
# 同理生成 MASTER_KEY

# 启动 (首次启动会自动创建 RSA 密钥对到 server/keys/)
npm run dev
```

首次启动会输出默认账号:
- 管理员: `admin` / `admin123`
- 教师: `teacher01` / `teacher123`
- 学生: `student01` / `student123`

### 3. 前端

```bash
cd client
npm install
npm run dev
```

访问 http://localhost:5173

## 加密体系说明

### 密码 (argon2id)
用户密码由 Sequelize `beforeCreate` / `beforeUpdate` hook 自动使用 argon2id 哈希 (`memoryCost: 64 MiB, timeCost: 3`)。登录时通过 `verifyPassword` 兼容 bcrypt 遗留哈希, 一旦校验成功且是 bcrypt, 会自动重新哈希为 argon2id 并写回数据库。

### JWT (RS256)
- 签名使用 `server/keys/private.pem`
- 验签使用 `server/keys/public.pem`
- 首次启动 `initKeys()` 自动生成 2048 位 RSA 密钥对
- 私钥文件权限自动收敛为 0600 (Windows 无效)
- `.gitignore` 已排除 `server/keys/private.pem` 与 `*.key`

### 字段级加密 (AES-256-GCM)
- 使用 `FIELD_ENCRYPTION_KEY` (32 字节 hex)
- 目前应用于 `Submission.content`, 存储列为 `contentCipher`, 应用层通过 VIRTUAL 字段 `content` 透明读写
- 报文格式: `base64(iv[12] | tag[16] | ciphertext)`

未加密以下字段并说明原因:
- `email`: 需要 UNIQUE 索引与登录查找
- `Grade.score`: 需要聚合统计 (avg/max/min/passRate)
- `username`: 需要 UNIQUE 索引

### .env 加密工具

```bash
# 生成主密钥
node server/bin/env-crypt.js genkey

# 加密
MASTER_KEY=<64位hex> node server/bin/env-crypt.js encrypt .env .env.enc

# 解密
MASTER_KEY=<64位hex> node server/bin/env-crypt.js decrypt .env.enc .env
```

## API 概览

| 模块 | 路径前缀 |
|------|----------|
| 认证 | `/api/auth` |
| 课程 | `/api/courses` |
| 作业 | `/api/assignments` |
| 成绩 | `/api/grades` |
| 考勤 | `/api/attendance` |
| 用户管理 | `/api/users` (admin) |
| 仪表盘 | `/api/dashboard` |

统一响应格式:

```json
{ "code": 0, "message": "success", "data": { ... } }
```

## 生产部署注意事项

- `NODE_ENV=production` 下会禁用 `sequelize.sync({ alter: true })`, 请改用迁移
- 使用真实的强 `FIELD_ENCRYPTION_KEY` 和 `MASTER_KEY`, 妥善备份
- 使用 HTTPS 反向代理 (Nginx / Caddy)
- 定期轮换 RSA 密钥对 (需要重新签发所有 token)

## 许可证

MIT
