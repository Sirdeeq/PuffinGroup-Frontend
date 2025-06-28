"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2,
  Plus,
  Users,
  Mail,
  User,
  Building,
  Search,
  UserPlus,
  Eye,
  EyeOff,
  RefreshCw,
  Edit,
  Key,
  UserX,
  UserCheck,
  Trash2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Helper function to get user's email domain (full domain)
function getUserEmailDomain(user: any): string | null {
  if (!user?.email) return null
  const emailParts = user.email.split("@")
  if (emailParts.length !== 2) return null
  return emailParts[1] // Return just the domain part (e.g., "department.com")
}

function getDepartmentCode(department: any): string | null {
  if (!department) return null

  if (typeof department === "object" && department !== null) {
    if (typeof department.code === "string") {
      return department.code
    }
    if (typeof department === "string") {
      return department
    }
  }
  return null
}

// Browser-safe password generator
function generateSecurePassword(length = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }
  return password
}

export default function UserManagementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    position: "Department User",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
  })
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  const departmentCode = getDepartmentCode(user?.department)

  // Theme color function based on user role
  const getThemeColor = () => {
    switch (user?.role) {
      case "admin":
        return {
          primary: "orange-600",
          primaryHover: "orange-700",
          bg: "orange-50",
          bgGradient: "from-orange-50 to-amber-50",
          text: "orange-600",
          badge: "orange-100",
          badgeText: "orange-800",
        }
      case "director":
        return {
          primary: "red-600",
          primaryHover: "red-700",
          bg: "red-50",
          bgGradient: "from-red-50 to-pink-50",
          text: "red-600",
          badge: "red-100",
          badgeText: "red-800",
        }
      case "department":
        return {
          primary: "green-600",
          primaryHover: "green-700",
          bg: "green-50",
          bgGradient: "from-green-50 to-emerald-50",
          text: "green-600",
          badge: "green-100",
          badgeText: "green-800",
        }
      default:
        return {
          primary: "blue-600",
          primaryHover: "blue-700",
          bg: "blue-50",
          bgGradient: "from-blue-50 to-indigo-50",
          text: "blue-600",
          badge: "blue-100",
          badgeText: "blue-800",
        }
    }
  }

  const themeColors = getThemeColor()

  // Helper function to generate a secure random password
  const generatePassword = () => {
    const password = generateSecurePassword(16)
    setFormData((prev) => ({ ...prev, password }))
    toast.success("Secure password generated!")
  }

  const fetchDepartmentUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await api.getDepartmentUsers(user)
      if (response.success) {
        setUsers(response.data.users || [])
      }
    } catch (error) {
      toast.error("Failed to fetch department users")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    fetchDepartmentUsers()
  }, [])

  const handleOpenForm = () => {
    const userDomain = getUserEmailDomain(user)
    if (userDomain) {
      setFormData({
        username: "",
        firstName: "",
        lastName: "",
        email: `@${userDomain}`,
        password: "",
        position: "Department User",
      })
    }
    setShowForm(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "username") {
      const userDomain = getUserEmailDomain(user)
      const newEmail = value && userDomain ? `${value}@${userDomain}` : `@${userDomain || ""}`
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        email: newEmail,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form data
      if (!formData.username.trim()) {
        throw new Error("Username is required")
      }

      if (!formData.firstName.trim()) {
        throw new Error("First name is required")
      }

      if (!formData.lastName.trim()) {
        throw new Error("Last name is required")
      }

      if (!formData.email.trim()) {
        throw new Error("Email is required")
      }

      if (!formData.password.trim()) {
        throw new Error("Password is required")
      }

      if (!formData.position.trim()) {
        throw new Error("Position is required")
      }

      // Validate email format
      const userDomain = getUserEmailDomain(user)
      if (!userDomain) {
        throw new Error("Unable to determine your email domain. Please contact administrator.")
      }

      if (!formData.email.toLowerCase().endsWith(`@${userDomain.toLowerCase()}`)) {
        throw new Error(`Email must use your department domain: @${userDomain}`)
      }

      // Prepare data for API call
      const userData = {
        username: formData.username.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        position: formData.position.trim(),
      }

      console.log("Submitting user data:", userData)

      // Submit to API with auth context
      const response = await api.registerUserUnderDepartment(userData, user)

      if (response.success) {
        toast.success("User registered successfully!")
        setFormData({
          username: "",
          firstName: "",
          lastName: "",
          email: `@${userDomain || ""}`,
          password: "",
          position: "Department User",
        })
        setShowForm(false)
        fetchDepartmentUsers()
      } else {
        throw new Error(response.message || "Failed to register user")
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to register user")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const openEditModal = (user: any) => {
    setSelectedUser(user)
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      position: user.position || "",
    })
    setShowEditModal(true)
  }

  const openChangePasswordModal = (user: any) => {
    setSelectedUser(user)
    setPasswordFormData({
      newPassword: "",
      confirmPassword: "",
    })
    setShowChangePasswordModal(true)
  }

  const openSuspendDialog = (user: any) => {
    setSelectedUser(user)
    setShowSuspendDialog(true)
  }

  const openDeleteDialog = (user: any) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      setIsLoading(true)
      const response = await api.updateDepartmentUser(selectedUser._id, editFormData, user)

      if (response.success) {
        toast.success("User updated successfully!")
        setShowEditModal(false)
        fetchDepartmentUsers()
      } else {
        throw new Error(response.message || "Failed to update user")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!selectedUser) return

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (passwordFormData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    try {
      setIsLoading(true)
      const response = await api.changeDepartmentUserPassword(
        selectedUser._id,
        {
          newPassword: passwordFormData.newPassword,
        },
        user,
      )

      if (response.success) {
        toast.success("Password changed successfully!")
        setShowChangePasswordModal(false)
        setPasswordFormData({ newPassword: "", confirmPassword: "" })
      } else {
        throw new Error(response.message || "Failed to change password")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuspendUser = async () => {
    if (!selectedUser) return

    try {
      setIsLoading(true)
      const action = selectedUser.isActive ? "suspend" : "activate"
      const response = await api.toggleDepartmentUserStatus(selectedUser._id, { action }, user)

      if (response.success) {
        toast.success(`User ${action}d successfully!`)
        setShowSuspendDialog(false)
        fetchDepartmentUsers()
      } else {
        throw new Error(response.message || `Failed to ${action} user`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${selectedUser.isActive ? "suspend" : "activate"} user`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setIsLoading(true)
      const response = await api.deleteDepartmentUser(selectedUser._id, user)

      if (response.success) {
        toast.success("User deleted successfully!")
        setShowDeleteDialog(false)
        fetchDepartmentUsers()
      } else {
        throw new Error(response.message || "Failed to delete user")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 bg-${themeColors.bg} rounded-lg`}>
            <Users className={`h-6 w-6 text-${themeColors.text}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users in your department</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          {departmentCode && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Department:</span>
              <Badge variant="secondary" className="font-medium">
                {departmentCode.toUpperCase()}
              </Badge>
            </div>
          )}

          {user?.role && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Role:</span>
              <Badge className={`bg-${themeColors.badge} text-${themeColors.badgeText} hover:bg-${themeColors.badge}`}>
                {user.role.toUpperCase()}
              </Badge>
            </div>
          )}

          {user?.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Domain:</span>
              <Badge variant="outline" className="font-medium">
                @{getUserEmailDomain(user)}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Main Content Card */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className={`bg-gradient-to-r ${themeColors.bgGradient} border-b`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserPlus className={`h-5 w-5 text-${themeColors.text}`} />
              Department Users
              <Badge variant="outline" className="ml-2">
                {users.length} {users.length === 1 ? "user" : "users"}
              </Badge>
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              {/* Add User Dialog */}
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleOpenForm}
                    className={`bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className={`h-5 w-5 text-${themeColors.text}`} />
                      Add New Department User
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                          Username *
                        </Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="pl-10"
                            placeholder="Enter username"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                          First Name *
                        </Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="pl-10"
                            placeholder="Enter first name"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                          Last Name *
                        </Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="pl-10"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address *
                        </Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled
                            className="pl-10 bg-gray-50 text-gray-600"
                            placeholder={`username@${getUserEmailDomain(user) || "department.com"}`}
                          />
                        </div>
                        {user?.email && (
                          <p className={`text-xs text-${themeColors.text} mt-1`}>
                            ✓ Email auto-generated with domain:{" "}
                            <span className="font-medium">@{getUserEmailDomain(user)}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password *
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="pr-20"
                            placeholder="Enter or generate password"
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                              className="h-8 w-8 p-0"
                              title="Toggle password visibility"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={generatePassword}
                              className="h-8 w-8 p-0"
                              title="Generate secure password"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Click <RefreshCw className="inline h-3 w-3" /> to generate a secure 16-character password
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                          Position *
                        </Label>
                        <Input
                          id="position"
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                          required
                          className="mt-1"
                          placeholder="Department User"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className={`flex-1 bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create User
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`h-8 w-8 animate-spin text-${themeColors.text}`} />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No users found" : "No users yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first department user"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleOpenForm}
                  className={`bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Username</TableHead>
                    <TableHead className="font-semibold text-gray-900">Email</TableHead>
                    <TableHead className="font-semibold text-gray-900">Position</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={user.id || user._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 bg-${themeColors.bg} rounded-full flex items-center justify-center`}>
                            <span className={`text-sm font-medium text-${themeColors.text}`}>
                              {user.username?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                          {user.username}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {user.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {user.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openChangePasswordModal(user)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSuspendDialog(user)}
                            className={
                              user.isActive
                                ? "text-orange-600 hover:text-orange-700"
                                : "text-green-600 hover:text-green-700"
                            }
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className={`h-5 w-5 text-${themeColors.text}`} />
              Edit User: {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <Label htmlFor="edit-position">Position</Label>
              <Input
                id="edit-position"
                value={editFormData.position}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, position: e.target.value }))}
                placeholder="Enter position"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleEditUser}
                disabled={isLoading}
                className={`flex-1 bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className={`h-5 w-5 text-${themeColors.text}`} />
              Change Password: {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordFormData.newPassword}
                onChange={(e) => setPasswordFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowChangePasswordModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isLoading}
                className={`flex-1 bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspend/Activate User Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedUser?.isActive ? "Suspend" : "Activate"} User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedUser?.isActive ? "suspend" : "activate"} "{selectedUser?.username}"?
              {selectedUser?.isActive && " This will prevent them from logging in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              disabled={isLoading}
              className={
                selectedUser?.isActive ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedUser?.isActive ? "Suspend" : "Activate"} User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedUser?.username}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
