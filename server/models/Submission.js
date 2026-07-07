import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { encryptField, decryptField } from '../utils/crypto.js'

// Submission: 内容通过 VIRTUAL 字段做透明加解密
// 底层存 contentCipher (base64 密文), 应用层读写 content 明文
const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 加密存储的实际列 (AES-256-GCM)
  contentCipher: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // 应用层看到的明文字段 (读取自动解密, 写入自动加密)
  content: {
    type: DataTypes.VIRTUAL,
    get () {
      return decryptField(this.getDataValue('contentCipher'))
    },
    set (value) {
      this.setDataValue('contentCipher', encryptField(value))
    }
  },
  files: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: { min: 0, max: 100 }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  gradedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'submissions',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['assignmentId', 'studentId'] },
    { fields: ['studentId'] }
  ]
})

export default Submission
