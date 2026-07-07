import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  semester: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'courses',
  timestamps: true,
  indexes: [{ fields: ['teacherId'] }]
})

export default Course
