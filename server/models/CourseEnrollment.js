import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

// 选课关系表 (多对多的联结表)
const CourseEnrollment = sequelize.define('CourseEnrollment', {
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
  enrolledAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'course_enrollments',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['courseId', 'studentId'] },
    { fields: ['studentId'] }
  ]
})

export default CourseEnrollment
