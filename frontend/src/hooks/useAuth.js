"use client"

import { useEffect, useState } from "react"
import axios from "axios"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL = "http://localhost:3000/api"

  useEffect(() => {
    verifyUser()
  }, [])

  const verifyUser = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(response.data)
    } catch (err) {
      localStorage.removeItem("token")
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      localStorage.setItem("token", response.data.token)
      setUser(response.data.user)
      return response.data.user
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  const register = async (name, email, password, userType) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        userType,
      })
      localStorage.setItem("token", response.data.token)
      setUser(response.data.user)
      return response.data.user
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }
}
