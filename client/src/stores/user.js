import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    token.value = response.data.token
    user.value = response.data.user
    localStorage.setItem('token', token.value)
    return response.data
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  }

  const getProfile = async () => {
    const response = await api.get('/auth/profile')
    user.value = response.data.user
    return response.data
  }

  const updateProfile = async (userData) => {
    const response = await api.put('/auth/profile', userData)
    user.value = response.data.user
    return response.data
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    login,
    register,
    getProfile,
    updateProfile,
    logout
  }
})
