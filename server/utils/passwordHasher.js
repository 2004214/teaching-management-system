import argon2 from 'argon2'
import bcrypt from 'bcryptjs'

// argon2id 参数 (兼顾安全与性能)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 1
}

// 生成 argon2id 哈希
export const hashPassword = async (plaintext) => {
  return argon2.hash(plaintext, ARGON2_OPTIONS)
}

// 校验密码, 同时兼容遗留的 bcrypt 哈希
// 返回 { valid, needsRehash }
//   - valid: 是否匹配
//   - needsRehash: 校验成功但需要升级到 argon2id
export const verifyPassword = async (plaintext, hash) => {
  if (!hash) return { valid: false, needsRehash: false }

  // bcrypt 遗留哈希 ($2a$ / $2b$ / $2y$)
  if (/^\$2[aby]\$/.test(hash)) {
    const valid = await bcrypt.compare(plaintext, hash)
    return { valid, needsRehash: valid }
  }

  // argon2 系列 ($argon2i$ / $argon2d$ / $argon2id$)
  if (hash.startsWith('$argon2')) {
    try {
      const valid = await argon2.verify(hash, plaintext)
      const needsRehash = valid && argon2.needsRehash(hash, ARGON2_OPTIONS)
      return { valid, needsRehash }
    } catch {
      return { valid: false, needsRehash: false }
    }
  }

  return { valid: false, needsRehash: false }
}
