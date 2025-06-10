"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/utils/auth-api"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "director" | "department"
  department?: string
  position?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: { email: string; password: string; role: string }) => Promise<void>
  logout: () => void
  getUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to set token in both localStorage and cookies
const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token)
    // Set cookie that expires in 30 days
    document.cookie = `token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`
  }
}

// Helper function to remove token from both localStorage and cookies
const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }
}

// Helper function to get token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing token on mount
    const token = getToken()
    if (token) {
      getUser()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials: { email: string; password: string; role: string }) => {
    try {
      setLoading(true)
      const response = await authApi.login({
        email: credentials.email,
        password: credentials.password,
      })

      if (response.success && response.token) {
        setToken(response.token)
        setUser(response.data.user)
        setIsAuthenticated(true)

        // Force a page refresh to trigger middleware
        window.location.href = "/dashboard"
        return
      } else {
        throw new Error(response.message || "Invalid credentials")
      }
    } catch (error: unknown) {
      console.error("Login error:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Login failed")
    } finally {
      setLoading(false)
    }
  }

  const getUser = async () => {
    try {
      const response = await authApi.getUser()

      if (response.success && response.user) {
        setUser(response.user)
        setIsAuthenticated(true)
      } else {
        // If getUser fails, clear token and user state
        removeToken()
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error: unknown) {
      console.error("Get user failed:", error)
      removeToken()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    removeToken()
    setUser(null)
    setIsAuthenticated(false)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, getUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
