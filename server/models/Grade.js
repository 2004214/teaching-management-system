import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

// Grade: 每份作业每个学生只保留一条 (UNIQUE + upsert)
const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0, max: 100 }
  }
}, {
  tableName: 'grades',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['assignmentId', 'studentId'] },
    { fields: ['courseId'] },
    { fields: ['studentId'] }
  ]
})

export default Grade
