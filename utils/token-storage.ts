"use client"

// Helper functions for token management with both localStorage and cookies
export const tokenStorage = {
  // Store token in both localStorage and cookie
  setToken: (token: string) => {
    // Store in localStorage for easy access in JS
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token)
    }

    // Store in cookie for middleware access
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
  },

  // Get token from localStorage (preferred) or cookie
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      // Try localStorage first
      const token = localStorage.getItem("token")
      if (token) return token

      // Fall back to cookies
      const cookies = document.cookie.split(";")
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=")
        if (name === "token") return value
      }
    }
    return null
  },

  // Remove token from both localStorage and cookie
  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
    }
    document.cookie = "token=; path=/; max-age=0"
  },
}
