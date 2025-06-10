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
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Shield,
  UserCheck,
  Inbox,
  Share2,
  Plus,
  Eye,
  Bell,
  PenTool,
  User,
  LogOut,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"

interface SidebarProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: "admin" | "director" | "department"
    department?: string
    position?: string
    avatar?: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [openSections, setOpenSections] = useState<string[]>(["dashboard"])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

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

  const themeColor = getThemeColor()

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
      name: "Departments",
      icon: Building2,
      key: "departments",
      children: [
        { name: "Create New Department", href: "/dashboard/departments/create", icon: Plus },
        { name: "View All Departments", href: "/dashboard/departments", icon: Eye },
      ],
    },
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [
        { name: "Create File", href: "/dashboard/files/create", icon: Plus },
        { name: "All Files", href: "/dashboard/files", icon: Eye },
        { name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox, badge: "3" },
        { name: "Shared Files", href: "/dashboard/files/shared", icon: Share2 },
      ],
    },
    {
      name: "Requests",
      icon: MessageSquare,
      key: "requests",
      children: [
        { name: "Create Request", href: "/dashboard/requests/create", icon: Plus },
        { name: "All Requests", href: "/dashboard/requests", icon: Eye },
        { name: "Received Requests", href: "/dashboard/requests/inbox", icon: Inbox, badge: "5" },
      ],
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
      key: "reports",
    },
    {
      name: "User Management",
      icon: Users,
      key: "users",
      children: [
        { name: "Admins", href: "/dashboard/users/admins", icon: Shield },
        { name: "Directors", href: "/dashboard/users/directors", icon: UserCheck },
        { name: "Department Users", href: "/dashboard/users/departments", icon: Building2 },
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
        { name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
      ],
    },
  ]

  const directorNavigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      key: "dashboard",
    },
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [
        { name: "Review Files", href: "/dashboard/files/review", icon: Eye },
        { name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox, badge: "3" },
      ],
    },
    {
      name: "Requests",
      icon: MessageSquare,
      key: "requests",
      children: [
        { name: "Review Requests", href: "/dashboard/requests/review", icon: Eye },
        { name: "Received Requests", href: "/dashboard/requests/inbox", icon: Inbox, badge: "5" },
      ],
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
      key: "reports",
    },
    {
      name: "Team",
      href: "/dashboard/users/departments",
      icon: Users,
      key: "team",
    },
    {
      name: "Settings",
      icon: Settings,
      key: "settings",
      children: [
        { name: "Profile", href: "/dashboard/settings/profile", icon: User },
        { name: "Signature", href: "/dashboard/settings/signature", icon: PenTool },
        { name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
      ],
    },
  ]

  const departmentNavigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      key: "dashboard",
    },
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [
        { name: "Create File", href: "/dashboard/files/create", icon: Plus },
        { name: "My Files", href: "/dashboard/files/myfiles", icon: Eye },
        { name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox },
        { name: "Shared Files", href: "/dashboard/files/shared", icon: Share2 },
      ],
    },
    {
      name: "Requests",
      icon: MessageSquare,
      key: "requests",
      children: [
        { name: "Create Request", href: "/dashboard/requests/create", icon: Plus },
        { name: "My Requests", href: "/dashboard/requests", icon: Eye },
        { name: "Received Requests", href: "/dashboard/requests/inbox", icon: Inbox, badge: "5" },
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

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user.avatar || "/placeholder.svg?height=40&width=40"} alt="User" />
            <AvatarFallback className={`bg-${themeColor}-100 text-${themeColor}-800`}>
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <div key={item.key} className="mb-1">
              {item.children ? (
                <Collapsible
                  open={openSections.includes(item.key) || hasActiveChild(item.children)}
                  onOpenChange={() => toggleSection(item.key)}
                >
                  <CollapsibleTrigger
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      hasActiveChild(item.children)
                        ? `bg-${themeColor}-50 text-${themeColor}-700`
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                    <div className="flex items-center">
                      {item.badge && (
                        <Badge variant="secondary" className="mr-2 h-5 px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {openSections.includes(item.key) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 ml-6 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                          isActive(child.href)
                            ? `bg-${themeColor}-100 text-${themeColor}-700 font-medium`
                            : "text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        <div className="flex items-center">
                          <child.icon className="w-4 h-4 mr-3" />
                          {child.name}
                        </div>
                        {child.badge && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
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
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive(item.href)
                      ? `bg-${themeColor}-100 text-${themeColor}-700`
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
