"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Key,
  Building2,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Eye,
  Loader2,
  Trash2,
} from "lucide-react"
import { CreateUserModal } from "@/components/modals/CreateUserModal"
import { EditUserModal } from "@/components/modals/EditUserModal"
import { ViewUserModal } from "@/components/modals/ViewUserModal"
import { ResetPasswordModal } from "@/components/modals/ResetPasswordModal"
import { redirect } from "next/navigation"

interface DepartmentUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  department?: {
    _id: string
    name: string
    code: string
  }
  position?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

function DepartmentUsersPageContent() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<DepartmentUser | null>(null)


    // Redirect if not authenticated or not admin
    if (!authContext.isAuthenticated) {
      redirect("/login")
    }
  
    if (authContext.user?.role !== "admin") {
      redirect("/dashboard")
    }

  // Fetch department users and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all users and filter department users
        const usersResponse = await api.getUsers(authContext)
        if (usersResponse.success && usersResponse.data) {
          const allUsers = usersResponse.data.users || []
          const deptUsers = allUsers.filter((user: DepartmentUser) => user.role === "department")
          setDepartmentUsers(deptUsers)
        }

        // Fetch departments
        const deptResponse = await api.getDepartments({ includeInactive: false }, authContext)
        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data.departments || [])
        }
      } catch (error: any) {
        console.error("Error fetching department users:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load department users",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authContext, toast])

  // Filter users based on search and department
  const filteredUsers = departmentUsers.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = filterDepartment === "all" || user.department?._id === filterDepartment
    return matchesSearch && matchesDepartment
  })

  // Handle user actions
  const handleToggleStatus = async (user: DepartmentUser) => {
    try {
      const response = await api.updateUser(
        user._id,
        {
          isActive: !user.isActive,
        },
        authContext,
      )

      if (response.success) {
        setDepartmentUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u)))

        toast({
          title: `User ${!user.isActive ? "activated" : "deactivated"}`,
          description: `${user.firstName} ${user.lastName} is now ${!user.isActive ? "active" : "inactive"}`,
        })
      } else {
        throw new Error(response.error || "Failed to update user status")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (user: DepartmentUser) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      return
    }

    try {
      const response = await api.deleteUser(user._id, authContext)

      if (response.success) {
        setDepartmentUsers((prev) => prev.filter((u) => u._id !== user._id))

        toast({
          title: "User deleted",
          description: `${user.firstName} ${user.lastName} has been deleted`,
        })
      } else {
        throw new Error(response.error || "Failed to delete user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  // Modal handlers
  const openEditModal = (user: DepartmentUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const openViewModal = (user: DepartmentUser) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const openResetPasswordModal = (user: DepartmentUser) => {
    setSelectedUser(user)
    setShowResetPasswordModal(true)
  }

  const handleUserCreated = (newUser: DepartmentUser) => {
    setDepartmentUsers((prev) => [newUser, ...prev])
    setShowCreateModal(false)
  }

  const handleUserUpdated = (updatedUser: DepartmentUser) => {
    setDepartmentUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)))
    setShowEditModal(false)
    setSelectedUser(null)
  }

  // Get department counts
  const getDepartmentCounts = () => {
    const counts: { [key: string]: number } = { all: departmentUsers.length }
    departments.forEach((dept) => {
      counts[dept._id] = departmentUsers.filter((user) => user.department?._id === dept._id).length
    })
    return counts
  }

  const departmentCounts = getDepartmentCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading department users...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Department Users</h1>
          <p className="text-slate-600 mt-1">Manage department user accounts and access</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-green-500 hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search department users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments ({departmentCounts.all})</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name} ({departmentCounts[dept._id] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No department users found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || filterDepartment !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No department users have been created yet"}
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Department User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/placeholder.svg" alt={user.firstName} />
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {user.firstName} {user.lastName}
                      </h3>
                      <Badge className="bg-green-100 text-green-800">
                        <Building2 className="w-3 h-3 mr-1" />
                        Department User
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openViewModal(user)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(user)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openResetPasswordModal(user)}>
                        <Key className="w-4 h-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                        {user.isActive ? (
                          <>
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.department && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>{user.department.name}</span>
                    </div>
                  )}
                  {user.position && <div className="text-sm text-slate-600">Position: {user.position}</div>}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status:</span>
                    <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        departments={departments}
        onUserCreated={handleUserCreated}
        defaultRole="department"
      />

      {selectedUser && (
        <>
          <EditUserModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            user={selectedUser}
            departments={departments}
            onUserUpdated={handleUserUpdated}
          />

          <ViewUserModal open={showViewModal} onOpenChange={setShowViewModal} user={selectedUser} />

          <ResetPasswordModal
            open={showResetPasswordModal}
            onOpenChange={setShowResetPasswordModal}
            user={selectedUser}
          />
        </>
      )}
    </div>
  )
}

export default function DepartmentUsersPage() {
  return (
      <DepartmentUsersPageContent />
  )
}
