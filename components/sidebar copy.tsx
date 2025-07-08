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

export default function Sidebar({ user, isMobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()
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
      name: "Attendance",
      href: "/dashboard/attendance",
      icon: Users,
      key: "attendance",
    },
    {
      name: "Departments",
      icon: Building2,
      key: "departments",
      children: [
        // { name: "Create New Department", href: "/dashboard/departments/create", icon: Plus },
        { name: "Departments", href: "/dashboard/departments", icon: Eye },
      ],
    },
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [
        { name: "Create File", href: "/dashboard/files/create", icon: Plus },
        { name: "All Files", href: "/dashboard/files", icon: Eye },
        { name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox, },
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
        { name: "Received Requests", href: "/dashboard/requests/inbox", icon: Inbox },
      ],
    },
    // {
    //   name: "Reports",
    //   href: "/dashboard/reports",
    //   icon: BarChart3,
    //   key: "reports",
    // },
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
        // { name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
      ],
    },
  ]

  const directorNavigation: NavItem[] = [
    // {
    //   name: "Dashboard",
    //   href: "/dashboard/director",
    //   icon: LayoutDashboard,
    //   key: "dashboard",
    // },
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [{ name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox },
        // { name: "All Files", href: "/dashboard/files", icon: Eye },
      ],
    },
    {
      name: "Requests",
      icon: MessageSquare,
      key: "requests",
      children: [{ name: "Review Requests", href: "/dashboard/requests/review", icon: Eye },
        // { name: "All Requests", href: "/dashboard/requests", icon: Eye },
      ],
    },
    // {
    //   name: "Reports",
    //   href: "/dashboard/reports",
    //   icon: BarChart3,
    //   key: "reports",
    // },
    // {
    //   name: "Team",
    //   href: "/dashboard/users/departments",
    //   icon: Users,
    //   key: "team",
    // },
    {
      name: "Settings",
      icon: Settings,
      key: "settings",
      children: [
        { name: "Profile", href: "/dashboard/settings/profile", icon: User },
        { name: "Signature", href: "/dashboard/settings/signature", icon: PenTool },
        // { name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
      ],
    },
  ]

  const departmentNavigation: NavItem[] = [
    // {
    //   name: "Dashboard",
    //   href: "/dashboard/department",
    //   icon: LayoutDashboard,
    //   key: "dashboard",
    // },
    {
      name: "Files",
      icon: FileText,
      key: "files",
      children: [
        // { name: "Create File", href: "/dashboard/files/create", icon: Plus },
        { name: "My Files", href: "/dashboard/files/myfiles", icon: Eye },
        { name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox },
        // { name: "Shared Files", href: "/dashboard/files/shared", icon: Share2 },
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
        // { name: "Create File", href: "/dashboard/files/create", icon: Plus },
        { name: "My Files", href: "/dashboard/files/myfiles", icon: Eye },
        { name: "Received Files", href: "/dashboard/files/inbox", icon: Inbox },
        // { name: "Shared Files", href: "/dashboard/files/shared", icon: Share2 },
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
        // { name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
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
    <div className="flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || "/placeholder.svg?height=40&width=40"} alt="User" />
            <AvatarFallback className={`bg-${themeColor}-100 text-${themeColor}-800`}>
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate" title={user.email}>
              {user.email}
            </p>
            {user.position && <p className="text-xs text-slate-400 truncate">{user.position === "Department Staff" ? "Department Head" : user.position}</p>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
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
                      "flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-slate-100",
                      hasActiveChild(item.children)
                        ? `bg-${themeColor}-50 text-${themeColor}-700 border border-${themeColor}-200`
                        : "text-slate-700",
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.badge && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {openSections.includes(item.key) || hasActiveChild(item.children) ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 ml-6 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-slate-100",
                          isActive(child.href)
                            ? `bg-${themeColor}-100 text-${themeColor}-700 font-medium border border-${themeColor}-200`
                            : "text-slate-600",
                        )}
                      >
                        <div className="flex items-center min-w-0">
                          <child.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                          <span className="truncate">{child.name}</span>
                        </div>
                        {child.badge && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-2 flex-shrink-0">
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
                    "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-slate-100",
                    isActive(item.href)
                      ? `bg-${themeColor}-100 text-${themeColor}-700 border border-${themeColor}-200`
                      : "text-slate-700",
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-2 flex-shrink-0">
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
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 hidden lg:block">
      {sidebarContent}
    </div>
  )
}
