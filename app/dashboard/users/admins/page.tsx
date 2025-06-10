"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  Shield,
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

interface Admin {
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

function AdminsPageContent() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [admins, setAdmins] = useState<Admin[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)

  // Redirect if not authenticated or not admin
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  if (authContext.user?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch admins and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all users and filter admins
        const usersResponse = await api.getUsers(authContext)
        if (usersResponse.success && usersResponse.data?.users) {
          const allUsers = Array.isArray(usersResponse.data.users) 
            ? usersResponse.data.users 
            : []
          const adminUsers = allUsers.filter((user: Admin) => user.role === "admin")
          setAdmins(adminUsers)
        } else {
          setAdmins([])
        }

        // Fetch departments for the create modal
        const deptResponse = await api.getDepartments({ includeInactive: false }, authContext)
        if (deptResponse.success && deptResponse.data?.departments) {
          const departments = Array.isArray(deptResponse.data.departments) 
            ? deptResponse.data.departments 
            : []
          setDepartments(departments)
        } else {
          setDepartments([])
        }
      } catch (error: any) {
        console.error("Error fetching admins:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load administrators",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authContext, toast])

  // Filter admins based on search
  const filteredAdmins = admins.filter(
    (admin) =>
      (admin.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (admin.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (admin.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (admin.department?.[0] || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle admin actions
  const handleToggleStatus = async (admin: Admin) => {
    try {
      const response = await api.updateUser(
        admin._id,
        {
          isActive: !admin.isActive,
        },
        authContext,
      )

      if (response.success) {
        setAdmins((prev) => prev.map((a) => (a._id === admin._id ? { ...a, isActive: !a.isActive } : a)))

        toast({
          title: `Admin ${!admin.isActive ? "activated" : "deactivated"}`,
          description: `${admin.firstName} ${admin.lastName} is now ${!admin.isActive ? "active" : "inactive"}`,
        })
      } else {
        throw new Error(response.error || "Failed to update admin status")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async (admin: Admin) => {
    if (!confirm(`Are you sure you want to delete ${admin.firstName} ${admin.lastName}?`)) {
      return
    }

    try {
      const response = await api.deleteUser(admin._id, authContext)

      if (response.success) {
        setAdmins((prev) => prev.filter((a) => a._id !== admin._id))

        toast({
          title: "Admin deleted",
          description: `${admin.firstName} ${admin.lastName} has been deleted`,
        })
      } else {
        throw new Error(response.error || "Failed to delete admin")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin",
        variant: "destructive",
      })
    }
  }

  // Modal handlers
  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin)
    setShowEditModal(true)
  }

  const openViewModal = (admin: Admin) => {
    setSelectedAdmin(admin)
    setShowViewModal(true)
  }

  const openResetPasswordModal = (admin: Admin) => {
    setSelectedAdmin(admin)
    setShowResetPasswordModal(true)
  }

  const handleAdminCreated = (newAdmin: Admin) => {
    setAdmins((prev) => [newAdmin, ...prev])
    setShowCreateModal(false)
  }

  const handleAdminUpdated = (updatedAdmin: Admin) => {
    setAdmins((prev) => prev.map((a) => (a._id === updatedAdmin._id ? updatedAdmin : a)))
    setShowEditModal(false)
    setSelectedAdmin(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading administrators...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">System Administrators</h1>
          <p className="text-slate-600 mt-1">Manage administrator accounts and permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search administrators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Admins Grid */}
      {filteredAdmins.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No administrators found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm ? "Try adjusting your search criteria" : "No administrators have been created yet"}
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Administrator
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdmins.map((admin) => (
            <Card key={admin._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/placeholder.svg" alt={admin.firstName} />
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {(admin.firstName?.charAt(0) || 'A').toUpperCase()}
                        {(admin.lastName?.charAt(0) || 'A').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {admin.firstName} {admin.lastName}
                      </h3>
                      <Badge className="bg-orange-100 text-orange-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
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
                      <DropdownMenuItem onClick={() => openViewModal(admin)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(admin)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openResetPasswordModal(admin)}>
                        <Key className="w-4 h-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                        {admin.isActive ? (
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
                        onClick={() => handleDeleteAdmin(admin)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span>{admin.email}</span>
                  </div>
                  {admin.phone && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{admin.phone}</span>
                    </div>
                  )}
                  {admin.department && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Shield className="w-4 h-4" />
                      <span>{admin.department.name}</span>
                    </div>
                  )}
                  {admin.position && <div className="text-sm text-slate-600">Position: {admin.position}</div>}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status:</span>
                    <Badge className={admin.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {admin.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    Last login: {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : "Never"}
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
        onUserCreated={handleAdminCreated}
        defaultRole="admin"
      />

      {selectedAdmin && (
        <>
          <EditUserModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            user={selectedAdmin}
            departments={departments}
            onUserUpdated={handleAdminUpdated}
          />

          <ViewUserModal open={showViewModal} onOpenChange={setShowViewModal} user={selectedAdmin} />

          <ResetPasswordModal
            open={showResetPasswordModal}
            onOpenChange={setShowResetPasswordModal}
            user={selectedAdmin}
          />
        </>
      )}
    </div>
  )
}

export default function AdminsPage() {
  return (
      <AdminsPageContent />
  )
}
