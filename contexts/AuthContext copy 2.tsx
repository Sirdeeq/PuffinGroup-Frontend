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
  role: "admin" | "director" | "department" | "user"
  department?: string
  position?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: { email: string; password: string; role: string }) => Promise<any>
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
    localStorage.removeItem("userRole")
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
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

        // Store user role in localStorage and cookies
        localStorage.setItem("userRole", response.data.user.role)
        document.cookie = `userRole=${response.data.user.role}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`

        // Return success with user data
        return {
          success: true,
          data: {
            user: response.data.user,
          },
        }
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

        // Ensure user role is stored
        if (response.user.role) {
          localStorage.setItem("userRole", response.user.role)
          document.cookie = `userRole=${response.user.role}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`
        }
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
