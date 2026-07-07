// 集中注册所有关联关系, 避免循环依赖
import { sequelize } from '../config/database.js'
import User from './User.js'
import Course from './Course.js'
import CourseEnrollment from './CourseEnrollment.js'
import Assignment from './Assignment.js'
import Submission from './Submission.js'
import Grade from './Grade.js'
import Attendance from './Attendance.js'

// User <-> Course (teacher): 教师禁止级联删除 (RESTRICT, 保护历史课程)
User.hasMany(Course, { foreignKey: 'teacherId', as: 'teachingCourses', onDelete: 'RESTRICT' })
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' })

// User <-> Course (student, 多对多)
User.belongsToMany(Course, {
  through: CourseEnrollment,
  foreignKey: 'studentId',
  otherKey: 'courseId',
  as: 'enrolledCourses'
})
Course.belongsToMany(User, {
  through: CourseEnrollment,
  foreignKey: 'courseId',
  otherKey: 'studentId',
  as: 'students'
})
CourseEnrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' })
CourseEnrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' })

// Course <-> Assignment: 课程删除级联作业
Course.hasMany(Assignment, { foreignKey: 'courseId', as: 'assignments', onDelete: 'CASCADE' })
Assignment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' })

// Assignment <-> Submission: 作业删除级联提交
Assignment.hasMany(Submission, { foreignKey: 'assignmentId', as: 'submissions', onDelete: 'CASCADE' })
Submission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' })
Submission.belongsTo(User, { foreignKey: 'studentId', as: 'student' })
User.hasMany(Submission, { foreignKey: 'studentId', as: 'submissions', onDelete: 'RESTRICT' })

// Grade 关联
Course.hasMany(Grade, { foreignKey: 'courseId', as: 'grades', onDelete: 'CASCADE' })
Grade.belongsTo(Course, { foreignKey: 'courseId', as: 'course' })
Assignment.hasMany(Grade, { foreignKey: 'assignmentId', as: 'grades', onDelete: 'CASCADE' })
Grade.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' })
User.hasMany(Grade, { foreignKey: 'studentId', as: 'grades', onDelete: 'RESTRICT' })
Grade.belongsTo(User, { foreignKey: 'studentId', as: 'student' })

// Attendance 关联
Course.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendances', onDelete: 'CASCADE' })
Attendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' })
User.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendances', onDelete: 'RESTRICT' })
Attendance.belongsTo(User, { foreignKey: 'studentId', as: 'student' })

export {
  sequelize,
  User,
  Course,
  CourseEnrollment,
  Assignment,
  Submission,
  Grade,
  Attendance
}
