import crypto from 'crypto'

// 字段级加密 (AES-256-GCM)
// 密钥格式: 32 字节 hex 字符串 (64 字符)
// 输出格式: base64(iv[12] | tag[16] | ciphertext[N])

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

const getKey = () => {
  const hex = process.env.FIELD_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('FIELD_ENCRYPTION_KEY 必须是 64 字符的 hex 字符串 (32 字节)')
  }
  return Buffer.from(hex, 'hex')
}

export const encryptField = (plaintext) => {
  if (plaintext === null || plaintext === undefined || plaintext === '') return plaintext
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export const decryptField = (bundle) => {
  if (bundle === null || bundle === undefined || bundle === '') return bundle
  try {
    const buf = Buffer.from(bundle, 'base64')
    const iv = buf.subarray(0, IV_LENGTH)
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH)
    const key = getKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch (err) {
    // 解密失败一般是数据被篡改或密钥不匹配, 返回 null 由业务层处理
    return null
  }
}
