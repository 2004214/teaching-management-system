import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('../views/Courses.vue')
      },
      {
        path: 'courses/:id',
        name: 'CourseDetail',
        component: () => import('../views/CourseDetail.vue')
      },
      {
        path: 'assignments',
        name: 'Assignments',
        component: () => import('../views/Assignments.vue')
      },
      {
        path: 'assignments/:id',
        name: 'AssignmentDetail',
        component: () => import('../views/AssignmentDetail.vue')
      },
      {
        path: 'grades',
        name: 'Grades',
        component: () => import('../views/Grades.vue')
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('../views/Attendance.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      }
    ]
  }
]

// 使用 import.meta.env.BASE_URL 让 router 自动适配 vite.config.js 里的 base
// GitHub Pages: '/teaching-management-system/', 本地 dev: '/'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
