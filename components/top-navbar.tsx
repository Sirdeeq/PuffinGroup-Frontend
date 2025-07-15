"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Bell, LogOut, User, Menu, Crown, Shield, Star } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import EnhancedSidebar from "@/components/sidebar"
import { AttendanceWidget } from "@/components/attendance/attendance-widget"
import { io, Socket } from "socket.io-client"
interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    priority?: 'high' | 'medium' | 'low';
    file?: string;
    folder?: string;
  };
}
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/utils/api"
import { LogoNew } from "./logonew"


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
  const { logout, authContext } = useAuth() // Get authContext from useAuth
  const router = useRouter()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  // Fetch notifications using the API function
  const fetchNotifications = async () => {
    try {
      const response = await api.fetchNotifications(authContext)
      if (response.success) {
        setNotifications(response.notifications)
        setUnreadCount(response.notifications?.filter((n: Notification) => !n.isRead)?.length || 0)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      })
    }
  }

  // Mark notification as read using the API function
  const markAsRead = async (notificationId: string) => {
    try {
      // const response = await ApiClient.getInstance().put(
      //   `/api/notifications/${notificationId}/read`, 
      //   {}, // empty data object since we're just marking as read
      //   authContext
      // )

      const response = api.markAsRead(notificationId, authContext)

      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(prev => prev - 1)
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  // Mark all notifications as read using the API function
  const markAllAsRead = async () => {
    try {
      const response = await api.markAllAsRead(authContext)

      if (response.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001", {
      withCredentials: true,
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("token")
      }
    })

    setSocket(newSocket)

    // Join user's private room
    newSocket.emit("joinUserRoom", user.id)

    // Listen for new notifications
    newSocket.on("newNotification", (notification: Notification) => {
      setNotifications(prevNotifications => {
        // Ensure prev is an array before spreading
        const currentNotifications = Array.isArray(prevNotifications) ? prevNotifications : [];
        return [notification, ...currentNotifications];
      });
      
      setUnreadCount(prevCount => {
        // Ensure prev is a number
        const currentCount = typeof prevCount === 'number' ? prevCount : 0;
        return currentCount + 1;
      });

      // Show toast for important notifications
      if (notification.data?.priority === "high") {
        toast({
          title: "New Notification",
          description: notification.message,
          variant: "default",
        })
      }
    })

    // Clean up on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [user.id, toast])

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications()
  }, [])

  const NotificationsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 flex items-center justify-center">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-xs font-bold text-white">{unreadCount}</span>
              </div>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0" align="end" forceMount>
        <DropdownMenuLabel className="p-4 border-b">
          <div className="flex justify-between items-center">
            <span>Notifications</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                markAllAsRead()
              }}
            >
              Mark all as read
            </Button>
          </div>
        </DropdownMenuLabel>

        <div className="max-h-96 overflow-y-auto">
          {notifications?.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications?.map(notification => (
              <DropdownMenuItem
                key={notification._id}
                className={`p-3 hover:bg-slate-50 rounded-none transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  markAsRead(notification._id)
                  if (notification.data?.file) {
                    router.push(`/dashboard/files/${notification.data.file}`)
                  } else if (notification.data?.folder) {
                    router.push(`/dashboard/folders/${notification.data.folder}`)
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-full ${notification.isRead ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    <Bell className={`w-4 h-4 ${notification.isRead ? 'text-gray-500' : 'text-blue-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const getThemeConfig = () => {
    switch (user.role) {
      case "admin":
        return {
          primary: "from-orange-500 to-amber-500",
          secondary: "bg-orange-50",
          accent: "text-orange-600",
          accentBg: "bg-orange-100",
          text: "text-orange-700",
          border: "border-orange-200",
          icon: Crown,
          label: "Administrator",
          description: "System Administrator",
        }
      case "director":
        return {
          primary: "from-red-500 to-rose-500",
          secondary: "bg-red-50",
          accent: "text-red-600",
          accentBg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-200",
          icon: Shield,
          label: "Director",
          description: "General Managing Director",
        }
      case "department":
        return {
          primary: "from-emerald-500 to-green-500",
          secondary: "bg-emerald-50",
          accent: "text-emerald-600",
          accentBg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: Star,
          label: "Department Head",
          description: "Department Head",
        }
      default:
        return {
          primary: "from-blue-500 to-indigo-500",
          secondary: "bg-blue-50",
          accent: "text-blue-600",
          accentBg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-200",
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
              <LogoNew size="md" showText={false} />
              <div className="hidden sm:block">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border",
                    theme.secondary,
                    theme.border,
                  )}
                >
                  <theme.icon className={cn("w-4 h-4", theme.accent)} />
                  <Badge variant="outline" className={cn("bg-white/50 text-xs font-medium", theme.text, theme.border)}>
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
            <NotificationsDropdown />

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
                      <theme.icon className={cn("w-3 h-3", theme.accent)} />
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

                  <DropdownMenuItem
                    className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    onClick={() => router.push("/dashboard/settings/profile")}
                  >
                    <User className="mr-3 h-4 w-4 text-slate-600" />
                    <span className="font-medium">Profile Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem
                    onClick={logout}
                    className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  )
}
