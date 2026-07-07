import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

let cachedPrivate = null
let cachedPublic = null

const resolvePath = (p) => path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)

// 首次启动时自动生成 RSA 2048 密钥对
export const initKeys = () => {
  const privatePath = resolvePath(process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem')
  const publicPath = resolvePath(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem')
  const keysDir = path.dirname(privatePath)

  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true })
  }

  if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
    return { privatePath, publicPath, generated: false }
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })

  fs.writeFileSync(privatePath, privateKey, { mode: 0o600 })
  fs.writeFileSync(publicPath, publicKey, { mode: 0o644 })

  // 私钥权限收敛 (Linux/macOS 上生效, Windows 会忽略)
  try { fs.chmodSync(privatePath, 0o600) } catch {}

  return { privatePath, publicPath, generated: true }
}

export const getPrivateKey = () => {
  if (cachedPrivate) return cachedPrivate
  const p = resolvePath(process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem')
  cachedPrivate = fs.readFileSync(p, 'utf8')
  return cachedPrivate
}

export const getPublicKey = () => {
  if (cachedPublic) return cachedPublic
  const p = resolvePath(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem')
  cachedPublic = fs.readFileSync(p, 'utf8')
  return cachedPublic
}
