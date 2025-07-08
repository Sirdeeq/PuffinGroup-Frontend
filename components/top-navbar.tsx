"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Bell, LogOut, Settings, User, Menu, Crown, Shield, Star, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from "@/components/logo"
import EnhancedSidebar from "@/components/sidebar"
import { AttendanceWidget } from "@/components/attendance/attendance-widget"
import router from "next/router"

interface UserType {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "director" | "department" | "user"
  department?: string
  position?: string
  avatar?: string
}

interface TopNavbarProps {
  user: UserType
}

export default function EnhancedTopNavbar({ user }: TopNavbarProps) {
  const { logout } = useAuth()
  const [notifications] = useState(0) // Mock notification count
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getThemeConfig = () => {
    switch (user.role) {
      case "admin":
        return {
          primary: "from-orange-500 to-amber-500",
          secondary: "from-orange-50 to-amber-50",
          accent: "orange-500",
          text: "orange-700",
          bg: "orange-50",
          border: "orange-200",
          icon: Crown,
          label: "Administrator",
          description: "System Administrator",
        }
      case "director":
        return {
          primary: "from-red-500 to-rose-500",
          secondary: "from-red-50 to-rose-50",
          accent: "red-500",
          text: "red-700",
          bg: "red-50",
          border: "red-200",
          icon: Shield,
          label: "Director",
          description: "General Managing Director",
        }
      case "department":
        return {
          primary: "from-emerald-500 to-green-500",
          secondary: "from-emerald-50 to-green-50",
          accent: "emerald-500",
          text: "emerald-700",
          bg: "emerald-50",
          border: "emerald-200",
          icon: Star,
          label: "Department Head",
          description: "Department Head",
        }
      default:
        return {
          primary: "from-blue-500 to-indigo-500",
          secondary: "from-blue-50 to-indigo-50",
          accent: "blue-500",
          text: "blue-700",
          bg: "blue-50",
          border: "blue-200",
          icon: User,
          label: "User",
          description: "Department User",
        }
    }
  }

  const theme = getThemeConfig()

  

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-slate-100">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <EnhancedSidebar user={user} isMobile onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center space-x-4">
              <Logo size="md" showText={false} />
              <div className="hidden sm:block">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${theme.secondary} border border-${theme.border}`}
                >
                  <theme.icon className={`w-4 h-4 text-${theme.accent}`} />
                  <Badge
                    variant="outline"
                    className={`text-${theme.text} border-${theme.border} bg-white/50 text-xs font-medium`}
                  >
                    {theme.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-4">
            {/* Compact Attendance Widget */}
            <div className="hidden md:block">
              <AttendanceWidget compact={true} />
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-xs font-bold text-white">{notifications}</span>
                    </div>
                  </div>
                )}
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-slate-200 transition-all"
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                      <AvatarImage src={user.avatar || "/placeholder.svg?height=36&width=36"} alt="User" />
                      <AvatarFallback className={`bg-gradient-to-br ${theme.primary} text-white font-semibold text-sm`}>
                        {user.firstName?.charAt(0)}
                        {user.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white rounded-full shadow-sm">
                      <theme.icon className={`w-3 h-3 text-${theme.accent}`} />
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-0" align="end" forceMount>
                {/* User Info Header */}
                <div className={`p-4 bg-gradient-to-br ${theme.primary} text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full"></div>
                  <div className="relative">
                    <DropdownMenuLabel className="font-normal p-0">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-white/30">
                          <AvatarImage src={user.avatar || "/placeholder.svg?height=48&width=48"} alt="User" />
                          <AvatarFallback className="bg-white/20 text-white font-semibold">
                            {user.firstName?.charAt(0)}
                            {user.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-white/80 truncate" title={user.email}>
                            {user.email}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <theme.icon className="w-3 h-3 text-white/80" />
                            <span className="text-xs text-white/80">{theme.description}</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </div>
                </div>

                <div className="p-2">
                  {/* Mobile Attendance Widget */}
                  <div className="md:hidden mb-2">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <AttendanceWidget compact={true} />
                    </div>
                  </div>

                  <DropdownMenuItem className="p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={() => router.push("/dashboard/settings/profile")}>
                    <User className="mr-3 h-4 w-4 text-slate-600" />
                    <span className="font-medium">Profile Settings</span>
                  </DropdownMenuItem>

                  {/* <DropdownMenuItem className="p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={() => router.push("/dashboard/settings/preferences")}>
                    <Settings className="mr-3 h-4 w-4 text-slate-600" />
                    <span className="font-medium">Preferences</span>
                  </DropdownMenuItem> */}

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem
                    onClick={logout}
                    className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </div>

                {/* Footer */}
                {/* <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Sparkles className="w-3 h-3" />
                    <span>Powered by v0</span>
                  </div>
                </div> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  )
}
