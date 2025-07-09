"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Settings,
  ChevronRight,
  Building2,
  Shield,
  UserCheck,
  Inbox,
  Plus,
  Eye,
  Bell,
  PenTool,
  User,
  Crown,
  Star,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: "admin" | "director" | "department" | "user"
    department?: string
    position?: string
    avatar?: string
  }
  isMobile?: boolean
  onNavigate?: () => void
}

export default function EnhancedSidebar({ user, isMobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<string[]>(["dashboard"])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

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
          label: "General Managing Director",
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
          label: "Department User",
        }
    }
  }

  const theme = getThemeConfig()

  interface NavItem {
    name: string
    href?: string
    icon: React.ElementType
    key: string
    badge?: string
    children?: {
      name: string
      href: string
      icon: React.ElementType
      badge?: string
    }[]
  }

  const adminNavigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      key: "dashboard",
    },
    {
      name: "Attendance",
      href: "/dashboard/attendance",
      icon: Users,
      key: "attendance",
    },
    {
      name: "Departments",
      icon: Building2,
      key: "departments",
      children: [{ name: "Departments", href: "/dashboard/departments", icon: Eye }],
    },
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [{ name: "All Files", href: "/dashboard/files", icon: Eye }],
    },
    {
      name: "Requests",
      icon: MessageSquare,
      key: "requests",
      children: [{ name: "All Requests", href: "/dashboard/requests", icon: Eye }],
    },
    {
      name: "User Management",
      icon: Users,
      key: "users",
      children: [
        { name: "Admins", href: "/dashboard/users/admins", icon: Shield },
        { name: "Directors", href: "/dashboard/users/directors", icon: UserCheck },
        { name: "Department Heads", href: "/dashboard/users/departments", icon: Building2 },
      ],
    },
    {
      name: "Settings",
      icon: Settings,
      key: "settings",
      children: [
        { name: "App Settings", href: "/dashboard/settings/app", icon: Settings },
        { name: "Profile", href: "/dashboard/settings/profile", icon: User },
        { name: "Signature", href: "/dashboard/settings/signature", icon: PenTool },
      ],
    },
  ]

  const directorNavigation: NavItem[] = [
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [{ name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox }],
    },
    {
      name: "Requests",
      icon: MessageSquare,
      key: "requests",
      children: [{ name: "Review Requests", href: "/dashboard/requests/review", icon: Eye }],
    },
    {
      name: "Settings",
      icon: Settings,
      key: "settings",
      children: [
        { name: "Profile", href: "/dashboard/settings/profile", icon: User },
        { name: "Signature", href: "/dashboard/settings/signature", icon: PenTool },
      ],
    },
  ]

  const departmentNavigation: NavItem[] = [
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [
        { name: "My Files", href: "/dashboard/files/myfiles", icon: Eye },
        { name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox },
      ],
    },
    {
      name: "Requests",
      icon: MessageSquare,
      key: "requests",
      children: [
        { name: "Create Request", href: "/dashboard/requests/create", icon: Plus },
        { name: "My Requests", href: "/dashboard/requests", icon: Eye },
        { name: "Received Requests", href: "/dashboard/requests/inbox", icon: Inbox },
      ],
    },
    {
      name: "Settings",
      icon: Settings,
      key: "settings",
      children: [
        { name: "Profile", href: "/dashboard/settings/profile", icon: User },
        { name: "Signature", href: "/dashboard/settings/signature", icon: PenTool },
        { name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
        { name: "User Management", href: "/dashboard/settings/usermanagement", icon: Users },
      ],
    },
  ]

  const userNavigation: NavItem[] = [
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [
        { name: "My Files", href: "/dashboard/files/myfiles", icon: Eye },
        { name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox },
      ],
    },
    {
      name: "Requests",
      icon: MessageSquare,
      key: "requests",
      children: [
        { name: "Create Request", href: "/dashboard/requests/create", icon: Plus },
        { name: "My Requests", href: "/dashboard/requests", icon: Eye },
        { name: "Received Requests", href: "/dashboard/requests/inbox", icon: Inbox },
      ],
    },
    {
      name: "Settings",
      icon: Settings,
      key: "settings",
      children: [
        { name: "Profile", href: "/dashboard/settings/profile", icon: User },
        { name: "Signature", href: "/dashboard/settings/signature", icon: PenTool },
      ],
    },
  ]

  const getNavigation = () => {
    switch (user.role) {
      case "admin":
        return adminNavigation
      case "director":
        return directorNavigation
      case "department":
        return departmentNavigation
      case "user":
        return userNavigation
      default:
        return departmentNavigation
    }
  }

  const navigation = getNavigation()

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const hasActiveChild = (children?: { href: string }[]) => {
    if (!children) return false
    return children.some((child) => isActive(child.href))
  }

  const handleLinkClick = () => {
    if (isMobile && onNavigate) {
      onNavigate()
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* User Profile Section */}
      <div className={`relative p-6 bg-gradient-to-br ${theme.primary} text-white overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full"></div>
        <div className="relative flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-white/30 shadow-lg">
              <AvatarImage src={user.avatar || "/placeholder.svg?height=48&width=48"} alt="User" />
              <AvatarFallback className="bg-white/20 text-white font-semibold">
                {user.firstName?.charAt(0)}
                {user.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full">
              <theme.icon className="w-3 h-3 text-slate-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-white/80 truncate" title={user.email}>
              {user.email}
            </p>
            <Badge className="mt-2 bg-white/20 text-white border-white/30 text-xs">{theme.label}</Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navigation.map((item) => (
            <div key={item.key} className="mb-2">
              {item.children ? (
                <Collapsible
                  open={openSections.includes(item.key) || hasActiveChild(item.children)}
                  onOpenChange={() => toggleSection(item.key)}
                >
                  <CollapsibleTrigger
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group hover:shadow-md",
                      hasActiveChild(item.children)
                        ? `${theme.secondary} ${theme.text} shadow-sm ${theme.border} border`
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    <div className="flex items-center">
                      <div
                        className={cn(
                          "p-2 rounded-lg mr-3 transition-all duration-300",
                          hasActiveChild(item.children) ? theme.accentBg : "bg-slate-100 group-hover:bg-slate-200",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-5 h-5 transition-colors duration-300",
                            hasActiveChild(item.children) ? theme.accent : "text-slate-600",
                          )}
                        />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <Badge variant="secondary" className="h-5 px-2 text-xs bg-slate-200 text-slate-700">
                          {item.badge}
                        </Badge>
                      )}
                      <div
                        className={cn(
                          "transition-transform duration-300",
                          openSections.includes(item.key) || hasActiveChild(item.children) ? "rotate-90" : "",
                        )}
                      >
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 ml-6 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-300 group hover:shadow-sm",
                          isActive(child.href)
                            ? `${theme.secondary} ${theme.text} font-medium shadow-sm ${theme.border} border`
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                        )}
                      >
                        <div className="flex items-center min-w-0">
                          <div
                            className={cn(
                              "p-1.5 rounded-md mr-3 transition-all duration-300",
                              isActive(child.href) ? theme.accentBg : "bg-slate-100 group-hover:bg-slate-200",
                            )}
                          >
                            <child.icon
                              className={cn(
                                "w-4 h-4 transition-colors duration-300",
                                isActive(child.href) ? theme.accent : "text-slate-500",
                              )}
                            />
                          </div>
                          <span className="truncate">{child.name}</span>
                        </div>
                        {child.badge && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-xs ml-2 flex-shrink-0 bg-slate-200 text-slate-700"
                          >
                            {child.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  href={item.href || "#"}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group hover:shadow-md",
                    isActive(item.href)
                      ? `${theme.secondary} ${theme.text} shadow-sm ${theme.border} border`
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-lg mr-3 transition-all duration-300",
                        isActive(item.href) ? theme.accentBg : "bg-slate-100 group-hover:bg-slate-200",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5 transition-colors duration-300",
                          isActive(item.href) ? theme.accent : "text-slate-600",
                        )}
                      />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="h-5 px-2 text-xs ml-2 flex-shrink-0 bg-slate-200 text-slate-700"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )

  if (isMobile) {
    return sidebarContent
  }

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white border-r border-slate-200 shadow-lg z-40">
      {sidebarContent}
    </div>
  )
}
