import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

let cachedPrivate = null
let cachedPublic = null

const resolvePath = (p) => path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)

// 从 env 中读取 PEM (支持 base64 编码, 避免多行换行符在 env 里被截断)
const readPemFromEnv = (rawKey, b64Key) => {
  if (process.env[rawKey]) {
    // 支持将 \n 字面量替换为真实换行
    return process.env[rawKey].replace(/\\n/g, '\n')
  }
  if (process.env[b64Key]) {
    return Buffer.from(process.env[b64Key], 'base64').toString('utf8')
  }
  return null
}

// 首次启动时自动生成 RSA 2048 密钥对 (仅本地开发场景)
// 云端部署应通过环境变量 JWT_PRIVATE_KEY_B64 / JWT_PUBLIC_KEY_B64 提供
export const initKeys = () => {
  // 环境变量方式: 直接返回, 无需落盘 (Render 免费实例文件系统是临时的)
  const envPrivate = readPemFromEnv('JWT_PRIVATE_KEY', 'JWT_PRIVATE_KEY_B64')
  const envPublic = readPemFromEnv('JWT_PUBLIC_KEY', 'JWT_PUBLIC_KEY_B64')
  if (envPrivate && envPublic) {
    cachedPrivate = envPrivate
    cachedPublic = envPublic
    return { generated: false, source: 'env' }
  }

  // 文件方式: 本地开发用
  const privatePath = resolvePath(process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem')
  const publicPath = resolvePath(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem')
  const keysDir = path.dirname(privatePath)

  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true })
  }

  if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
    return { privatePath, publicPath, generated: false, source: 'file' }
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })

  fs.writeFileSync(privatePath, privateKey, { mode: 0o600 })
  fs.writeFileSync(publicPath, publicKey, { mode: 0o644 })
  try { fs.chmodSync(privatePath, 0o600) } catch {}

  return { privatePath, publicPath, generated: true, source: 'file' }
}

export const getPrivateKey = () => {
  if (cachedPrivate) return cachedPrivate
  const fromEnv = readPemFromEnv('JWT_PRIVATE_KEY', 'JWT_PRIVATE_KEY_B64')
  if (fromEnv) {
    cachedPrivate = fromEnv
    return cachedPrivate
  }
  const p = resolvePath(process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem')
  cachedPrivate = fs.readFileSync(p, 'utf8')
  return cachedPrivate
}

export const getPublicKey = () => {
  if (cachedPublic) return cachedPublic
  const fromEnv = readPemFromEnv('JWT_PUBLIC_KEY', 'JWT_PUBLIC_KEY_B64')
  if (fromEnv) {
    cachedPublic = fromEnv
    return cachedPublic
  }
  const p = resolvePath(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem')
  cachedPublic = fs.readFileSync(p, 'utf8')
  return cachedPublic
}

// 辅助命令: 生成一对 base64 编码的密钥, 便于直接粘贴到云平台 env
export const generateKeyPairBase64 = () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
  return {
    privateKeyB64: Buffer.from(privateKey).toString('base64'),
    publicKeyB64: Buffer.from(publicKey).toString('base64')
  }
}
