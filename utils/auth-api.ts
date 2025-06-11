"use client"

import axios from "axios"
import { API_BASE_URL } from "./api"

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL:API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to add the auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }
      // Return the error instead of redirecting immediately
      return Promise.reject({
        status: 401,
        message: "Unauthorized access",
      })
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await apiClient.post("/api/auth/login", credentials)

      // Return the exact structure from the API response
      return {
        success: true,
        token: response.data.token,
        data: {
          user: response.data.user,
        },
      }
    } catch (error: any) {
      console.error("Login API error:", error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Login failed",
      }
    }
  },

  getUser: async () => {
    try {
      const response = await apiClient.get("/api/auth/me")
      return {
        success: true,
        user: response.data.user,
      }
    } catch (error: any) {
      console.error("Get user API error:", error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Failed to get user",
      }
    }
  },
}
