import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: 'assignments',
  timestamps: true,
  indexes: [
    { fields: ['courseId'] },
    { fields: ['deadline'] }
  ]
})

// 状态字段: 依赖 deadline 计算 (不入库)
Assignment.prototype.getStatus = function () {
  return new Date(this.deadline) > new Date() ? 'active' : 'expired'
}

export default Assignment
