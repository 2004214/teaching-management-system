import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Attendance = sequelize.define('Attendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'leave'),
    allowNull: false,
    defaultValue: 'present'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'attendances',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['courseId', 'studentId', 'date'] },
    { fields: ['courseId', 'date'] }
  ]
})

export default Attendance
