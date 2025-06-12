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
import { Bell, LogOut, Settings, User, Menu } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from "@/components/logo"
import Sidebar from "@/components/sidebar"

interface UserType {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "director" | "department"
  department?: string
  position?: string
  avatar?: string
}

interface TopNavbarProps {
  user: UserType
}

export default function TopNavbar({ user }: TopNavbarProps) {
  const { logout } = useAuth()
  const [notifications] = useState(3) // Mock notification count
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getThemeColor = () => {
    switch (user.role) {
      case "admin":
        return "orange"
      case "director":
        return "red"
      case "department":
        return "green"
      default:
        return "blue"
    }
  }

  const getRoleDisplayName = () => {
    switch (user.role) {
      case "admin":
        return "Administrator"
      case "director":
        return "Director"
      case "department":
        return "Department User"
      default:
        return "User"
    }
  }

  const themeColor = getThemeColor()

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <Sidebar user={user} isMobile onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center space-x-3">
              <Logo size="xxxxxl" showText={false} />
              <div className="hidden sm:block">
                <Badge
                  variant="outline"
                  className={`text-${themeColor}-600 border-${themeColor}-200 bg-${themeColor}-50`}
                >
                  {getRoleDisplayName()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg?height=32&width=32"} alt="User" />
                    <AvatarFallback className={`bg-${themeColor}-100 text-${themeColor}-700`}>
                      {user.firstName?.charAt(0)}
                      {user.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate" title={user.email}>
                      {user.email}
                    </p>
                    {user.position && <p className="text-xs leading-none text-muted-foreground">{user.position}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  )
}
