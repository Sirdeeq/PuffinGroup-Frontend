"use client"
import { useState, useEffect } from "react"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Edit, Trash2, Eye, UserPlus, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DepartmentForm } from "@/components/DepartmentForm"
import { AssignDirectorDialog } from "@/components/AssignDirectorDialog"

interface Department {
  _id: string
  name: string
  code: string
  description: string
  isActive: boolean
  director?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function DepartmentsPage() {
  const authContext = useAuth()
  const { toast } = useToast()

  // State management
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignDirectorDialog, setShowAssignDirectorDialog] = useState(false)

  // Selected department for operations
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  // Redirect if user is not authenticated or not admin
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  if (authContext.user?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getDepartments({ includeInactive: true }, authContext)

      if (response.success && response.data) {
        setDepartments(response.data.departments || [])
      } else {
        setError("Failed to load departments")
      }
    } catch (err: any) {
      console.error("Error fetching departments:", err)
      setError(err.message || "Error loading departments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  // CRUD operations
  const handleDelete = async () => {
    if (!selectedDepartment) return

    try {
      setSubmitting(true)
      const response = await api.delete(`/api/departments/${selectedDepartment._id}`, authContext)

      if (response.success) {
        toast({
          title: "Success",
          description: "Department deleted successfully",
        })
        setShowDeleteDialog(false)
        setSelectedDepartment(null)
        fetchDepartments()
      } else {
        throw new Error("Failed to delete department")
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete department",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Modal handlers
  const openCreateForm = () => {
    setShowCreateForm(true)
  }

  const openEditForm = (department: Department) => {
    setSelectedDepartment(department)
    setShowEditForm(true)
  }

  const openDetailModal = (department: Department) => {
    setSelectedDepartment(department)
    setShowDetailModal(true)
  }

  const openDeleteDialog = (department: Department) => {
    setSelectedDepartment(department)
    setShowDeleteDialog(true)
  }

  const openAssignDirectorDialog = (department: Department) => {
    setSelectedDepartment(department)
    setShowAssignDirectorDialog(true)
  }

  const getDepartmentStatus = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
        Inactive
      </Badge>
    )
  }

  const getDirectorInfo = (department: Department) => {
    if (department.director) {
      return (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-green-600" />
          <span className="text-sm">
            {department.director.firstName} {department.director.lastName}
          </span>
        </div>
      )
    }
    return (
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">No Director Assigned</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-orange-600">Department Management</h1>
            <p className="text-muted-foreground mt-2">Manage your organization's departments and directors</p>
          </div>
          <Button onClick={openCreateForm} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Department
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Departments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>View and manage all departments in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading departments...</span>
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No departments found</p>
                <Button onClick={openCreateForm} className="mt-4">
                  Create your first department
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Director</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{department.code}</Badge>
                      </TableCell>
                      <TableCell>{getDirectorInfo(department)}</TableCell>
                      <TableCell>{getDepartmentStatus(department.isActive)}</TableCell>
                      <TableCell>{new Date(department.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openDetailModal(department)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditForm(department)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!department.director && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAssignDirectorDialog(department)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(department)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Department Modal */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="sm:max-w-[500px]">
            <DepartmentForm
              onClose={() => setShowCreateForm(false)}
              onSuccess={() => {
                setShowCreateForm(false)
                fetchDepartments()
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Department Modal */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-[500px]">
            {selectedDepartment && (
              <DepartmentForm
                department={selectedDepartment}
                onClose={() => setShowEditForm(false)}
                onSuccess={() => {
                  setShowEditForm(false)
                  fetchDepartments()
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Director Dialog */}
        {selectedDepartment && (
          <AssignDirectorDialog
            department={selectedDepartment}
            open={showAssignDirectorDialog}
            onOpenChange={setShowAssignDirectorDialog}
            onSuccess={fetchDepartments}
          />
        )}

        {/* Department Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Department Details</DialogTitle>
            </DialogHeader>
            {selectedDepartment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm font-medium">{selectedDepartment.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Code</label>
                    <p className="text-sm font-medium">{selectedDepartment.code}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{selectedDepartment.description || "No description provided"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Director</label>
                    <div className="mt-1">{getDirectorInfo(selectedDepartment)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getDepartmentStatus(selectedDepartment.isActive)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm">{new Date(selectedDepartment.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm">{new Date(selectedDepartment.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the department "{selectedDepartment?.name}"
                and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Department"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
