"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import TopNavbar from "@/components/top-navbar"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-slate-700">Loading Dashboard</p>
            <p className="text-sm text-slate-500">Please wait while we prepare your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavbar user={user} />

      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <Sidebar user={user} />
        <main className="flex-1 ml-64 pt-16">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="min-h-[calc(100vh-7rem)]">{children}</div>
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <main className="pt-16">
          <div className="p-4">
            <div className="min-h-[calc(100vh-5rem)]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
