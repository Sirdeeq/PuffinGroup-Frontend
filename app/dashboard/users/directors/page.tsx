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
  UserCheck,
  Mail,
  Phone,
  Building2,
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

interface Director {
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

function DirectorsPageContent() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [directors, setDirectors] = useState<Director[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null)


    // Redirect if not authenticated or not admin
    if (!authContext.isAuthenticated) {
      redirect("/login")
    }
  
    if (authContext.user?.role !== "admin") {
      redirect("/dashboard")
    }

  // Fetch directors and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all users and filter directors
        const usersResponse = await api.getUsers(authContext)
        if (usersResponse.success && usersResponse.data) {
          const allUsers = usersResponse.data.users || []
          const directorUsers = allUsers.filter((user: Director) => user.role === "director")
          setDirectors(directorUsers)
        }

        // Fetch departments
        const deptResponse = await api.getDepartments({ includeInactive: false }, authContext)
        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data.departments || [])
        }
      } catch (error: any) {
        console.error("Error fetching directors:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load directors",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authContext, toast])

  // Filter directors based on search
  const filteredDirectors = directors.filter(
    (director) =>
      director.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      director.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      director.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (director.department?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle director actions
  const handleToggleStatus = async (director: Director) => {
    try {
      const response = await api.updateUser(
        director._id,
        {
          isActive: !director.isActive,
        },
        authContext,
      )

      if (response.success) {
        setDirectors((prev) => prev.map((d) => (d._id === director._id ? { ...d, isActive: !d.isActive } : d)))

        toast({
          title: `Director ${!director.isActive ? "activated" : "deactivated"}`,
          description: `${director.firstName} ${director.lastName} is now ${!director.isActive ? "active" : "inactive"}`,
        })
      } else {
        throw new Error(response.error || "Failed to update director status")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update director status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDirector = async (director: Director) => {
    if (!confirm(`Are you sure you want to delete ${director.firstName} ${director.lastName}?`)) {
      return
    }

    try {
      const response = await api.deleteUser(director._id, authContext)

      if (response.success) {
        setDirectors((prev) => prev.filter((d) => d._id !== director._id))

        toast({
          title: "Director deleted",
          description: `${director.firstName} ${director.lastName} has been deleted`,
        })
      } else {
        throw new Error(response.error || "Failed to delete director")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete director",
        variant: "destructive",
      })
    }
  }

  // Modal handlers
  const openEditModal = (director: Director) => {
    setSelectedDirector(director)
    setShowEditModal(true)
  }

  const openViewModal = (director: Director) => {
    setSelectedDirector(director)
    setShowViewModal(true)
  }

  const openResetPasswordModal = (director: Director) => {
    setSelectedDirector(director)
    setShowResetPasswordModal(true)
  }

  const handleDirectorCreated = (newDirector: Director) => {
    setDirectors((prev) => [newDirector, ...prev])
    setShowCreateModal(false)
  }

  const handleDirectorUpdated = (updatedDirector: Director) => {
    setDirectors((prev) => prev.map((d) => (d._id === updatedDirector._id ? updatedDirector : d)))
    setShowEditModal(false)
    setSelectedDirector(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading directors...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Department Directors</h1>
          <p className="text-slate-600 mt-1">Manage director accounts and department oversight</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-red-500 hover:bg-red-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Director
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search directors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Directors Grid */}
      {filteredDirectors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No directors found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm ? "Try adjusting your search criteria" : "No directors have been created yet"}
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-red-500 hover:bg-red-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Director
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDirectors.map((director) => (
            <Card key={director._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/placeholder.svg" alt={director.firstName} />
                      <AvatarFallback className="bg-red-100 text-red-700">
                        {director.firstName.charAt(0)}
                        {director.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {director.firstName} {director.lastName}
                      </h3>
                      <Badge className="bg-red-100 text-red-800">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Director
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
                      <DropdownMenuItem onClick={() => openViewModal(director)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(director)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Director
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openResetPasswordModal(director)}>
                        <Key className="w-4 h-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(director)}>
                        {director.isActive ? (
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
                        onClick={() => handleDeleteDirector(director)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Director
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span>{director.email}</span>
                  </div>
                  {director.phone && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{director.phone}</span>
                    </div>
                  )}
                  {director.department && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>{director.department.name} Department</span>
                    </div>
                  )}
                  {director.position && <div className="text-sm text-slate-600">Position: {director.position}</div>}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status:</span>
                    <Badge className={director.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {director.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    Last login: {director.lastLogin ? new Date(director.lastLogin).toLocaleDateString() : "Never"}
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
        onUserCreated={handleDirectorCreated}
        defaultRole="director"
      />

      {selectedDirector && (
        <>
          <EditUserModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            user={selectedDirector}
            departments={departments}
            onUserUpdated={handleDirectorUpdated}
          />

          <ViewUserModal open={showViewModal} onOpenChange={setShowViewModal} user={selectedDirector} />

          <ResetPasswordModal
            open={showResetPasswordModal}
            onOpenChange={setShowResetPasswordModal}
            user={selectedDirector}
          />
        </>
      )}
    </div>
  )
}

export default function DirectorsPage() {
  return (
      <DirectorsPageContent />
  )
}
