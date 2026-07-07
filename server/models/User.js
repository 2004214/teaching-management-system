import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { hashPassword, verifyPassword } from '../utils/passwordHasher.js'

// User: argon2id 密码哈希 + 默认作用域排除密码字段
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: { len: [3, 50] }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  role: {
    type: DataTypes.ENUM('admin', 'teacher', 'student'),
    allowNull: false,
    defaultValue: 'student'
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await hashPassword(user.password)
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await hashPassword(user.password)
      }
    }
  }
})

// 实例方法: 校验密码 (兼容 bcrypt 遗留哈希, 校验成功自动升级到 argon2id)
User.prototype.comparePassword = async function (plaintext) {
  const { valid, needsRehash } = await verifyPassword(plaintext, this.password)
  if (valid && needsRehash) {
    // 透明迁移: 跳过 hooks 避免重复哈希
    this.password = await hashPassword(plaintext)
    await this.save({ hooks: false })
  }
  return valid
}

export default User
