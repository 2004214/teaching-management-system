#!/usr/bin/env node
// .env 文件加解密 CLI (AES-256-GCM)
// 用法:
//   node bin/env-crypt.js genkey                       # 生成 MASTER_KEY
//   node bin/env-crypt.js encrypt <in.env> <out.enc>   # 加密
//   node bin/env-crypt.js decrypt <in.enc> <out.env>   # 解密
//
// 需要环境变量 MASTER_KEY (64 字符 hex)

import fs from 'fs'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

const getKey = () => {
  const hex = process.env.MASTER_KEY
  if (!hex || hex.length !== 64) {
    console.error('错误: 环境变量 MASTER_KEY 必须是 64 字符的 hex 字符串')
    process.exit(1)
  }
  return Buffer.from(hex, 'hex')
}

const encryptFile = (inPath, outPath) => {
  const key = getKey()
  const plaintext = fs.readFileSync(inPath)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  const bundle = Buffer.concat([iv, tag, encrypted])
  fs.writeFileSync(outPath, bundle.toString('base64'))
  console.log(`已加密 ${inPath} -> ${outPath}`)
}

const decryptFile = (inPath, outPath) => {
  const key = getKey()
  const bundle = Buffer.from(fs.readFileSync(inPath, 'utf8'), 'base64')
  const iv = bundle.subarray(0, IV_LENGTH)
  const tag = bundle.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const ciphertext = bundle.subarray(IV_LENGTH + TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  fs.writeFileSync(outPath, plaintext)
  console.log(`已解密 ${inPath} -> ${outPath}`)
}

const [, , cmd, ...args] = process.argv

switch (cmd) {
  case 'genkey':
    console.log(crypto.randomBytes(32).toString('hex'))
    break
  case 'encrypt':
    if (args.length !== 2) {
      console.error('用法: env-crypt encrypt <in.env> <out.enc>')
      process.exit(1)
    }
    encryptFile(args[0], args[1])
    break
  case 'decrypt':
    if (args.length !== 2) {
      console.error('用法: env-crypt decrypt <in.enc> <out.env>')
      process.exit(1)
    }
    decryptFile(args[0], args[1])
    break
  default:
    console.error('未知命令: ' + cmd)
    console.error('可用命令: genkey | encrypt | decrypt')
    process.exit(1)
}
