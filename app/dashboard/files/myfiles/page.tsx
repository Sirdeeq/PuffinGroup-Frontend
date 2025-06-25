"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  User,
  Calendar,
  Loader2,
  Search,
  MoreHorizontal,
  Grid3X3,
  List,
  Building2,
  Share,
  Plus,
} from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

interface FileData {
  _id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  requiresSignature?: boolean
  file: {
    name: string
    url: string
    size: number
    type: string
  }
  createdBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
    position?: string
  }
  departments: Array<{
    _id: string
    name: string
    code: string
    description?: string
  }>
  departmentNames?: string[]
  canEdit?: boolean
  canDelete?: boolean
  canShare?: boolean
  sharedWithMe?: boolean
  createdAt: string
  updatedAt: string
  sharedWith?: Array<{
    user: {
      _id: string
      firstName: string
      lastName: string
      email: string
    }
    permission: string
    sharedAt: string
  }>
}

export default function MyFilesPage() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [files, setFiles] = useState<FileData[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([])
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Fetch my files based on user role
  useEffect(() => {
    const fetchMyFiles = async () => {
      try {
        setLoading(true)
        const params = statusFilter !== "all" ? { status: statusFilter } : undefined
        const response = await api.getMyFiles(params, authContext)

        if (response.success && response.data) {
          setFiles(response.data.files || [])
          setFilteredFiles(response.data.files || [])
        }
      } catch (error) {
        console.error("Error fetching my files:", error)
        toast({
          title: "Error",
          description: "Failed to load files",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMyFiles()
  }, [authContext, toast, statusFilter])

  // Filter files based on search term
  useEffect(() => {
    const filtered = files.filter(
      (file) =>
        file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.createdBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.createdBy.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.departmentNames &&
          file.departmentNames.some((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))),
    )
    setFilteredFiles(filtered)
  }, [files, searchTerm])

  const handleDeleteFile = async () => {
    if (!selectedFile) return

    try {
      setIsProcessing(true)
      const response = await api.deleteFile(selectedFile._id, authContext)

      if (response.success) {
        setFiles((prev) => prev.filter((file) => file._id !== selectedFile._id))
        setShowDeleteDialog(false)
        setSelectedFile(null)
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "sent_back":
        return "bg-red-100 text-red-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-gray-100 text-gray-800"
      case "draft":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusCounts = () => {
    return {
      all: files.length,
      draft: files.filter((f) => f.status.toLowerCase() === "draft").length,
      active: files.filter((f) => f.status.toLowerCase() === "active").length,
      pending: files.filter((f) => f.status.toLowerCase() === "pending").length,
      approved: files.filter((f) => f.status.toLowerCase() === "approved").length,
      rejected: files.filter((f) => f.status.toLowerCase() === "rejected").length,
      sent_back: files.filter((f) => f.status.toLowerCase() === "sent_back").length,
    }
  }

  const statusCounts = getStatusCounts()

  const openViewModal = (file: FileData) => {
    setSelectedFile(file)
    setShowViewModal(true)
  }

  const openEditModal = (file: FileData) => {
    setSelectedFile(file)
    setShowEditModal(true)
  }

  const openDeleteDialog = (file: FileData) => {
    setSelectedFile(file)
    setShowDeleteDialog(true)
  }

  const openShareModal = (file: FileData) => {
    setSelectedFile(file)
    setShowShareModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading files...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Files</h1>
          <p className="text-slate-600 mt-1">
            {authContext.user?.role === "admin"
              ? "All files in the system"
              : authContext.user?.role === "director"
                ? "Files from your departments"
                : "Your created files"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            {filteredFiles.length} Files
          </Badge>
          <Link href="/dashboard/files/create">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Create File
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status.replace("_", " ")} ({count})
          </Button>
        ))}
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={viewMode === "card" ? "default" : "outline"} size="sm" onClick={() => setViewMode("card")}>
            <Grid3X3 className="w-4 h-4 mr-2" />
            Card View
          </Button>
          <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
            <List className="w-4 h-4 mr-2" />
            Table View
          </Button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No files found</h3>
            <p className="text-slate-600">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No files available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Card View */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map((file) => (
                <Card key={file._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{file.title}</CardTitle>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewModal(file)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {file.canEdit && (
                            <DropdownMenuItem onClick={() => openEditModal(file)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit File
                            </DropdownMenuItem>
                          )}
                          {file.canShare && (
                            <DropdownMenuItem onClick={() => openShareModal(file)}>
                              <Share className="w-4 h-4 mr-2" />
                              Share File
                            </DropdownMenuItem>
                          )}
                          {file.canDelete && (
                            <DropdownMenuItem onClick={() => openDeleteDialog(file)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 line-clamp-2">{file.description}</p>

                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      <span>
                        {file.createdBy.firstName} {file.createdBy.lastName}
                      </span>
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {file.category}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(file.status)}`}>{file.status}</Badge>
                      {file.priority && (
                        <Badge className={`text-xs ${getPriorityColor(file.priority)}`}>{file.priority}</Badge>
                      )}
                      {file.sharedWithMe && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          Shared with me
                        </Badge>
                      )}
                    </div>

                    {file.departmentNames && file.departmentNames.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {file.departmentNames.map((deptName, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Building2 className="w-2 h-2 mr-1" />
                            {deptName}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate max-w-[70%]">{file.file.name}</span>
                        <span>{formatFileSize(file.file.size)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openViewModal(file)} className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Departments</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-blue-100">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{file.title}</p>
                              <p className="text-sm text-slate-500 truncate max-w-xs">{file.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {file.createdBy.firstName} {file.createdBy.lastName}
                            </p>
                            <p className="text-slate-500">{file.createdBy.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                            {file.sharedWithMe && (
                              <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                                Shared
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {file.departmentNames?.slice(0, 2).map((deptName, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {deptName}
                              </Badge>
                            ))}
                            {file.departmentNames && file.departmentNames.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{file.departmentNames.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(file.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openViewModal(file)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {file.canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(file)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {file.canShare && (
                              <Button variant="ghost" size="sm" onClick={() => openShareModal(file)}>
                                <Share className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" asChild>
                              <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                            {file.canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(file)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* View File Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Details: {selectedFile?.title}</DialogTitle>
            <DialogDescription>Complete information about this file</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                  <p className="text-sm font-medium">{selectedFile.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="text-sm font-medium">{selectedFile.category}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedFile.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedFile.status)}>{selectedFile.status}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                  {selectedFile.priority ? (
                    <Badge className={getPriorityColor(selectedFile.priority)}>{selectedFile.priority}</Badge>
                  ) : (
                    <p className="text-sm">Not specified</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                  <p className="text-sm">
                    {selectedFile.createdBy.firstName} {selectedFile.createdBy.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedFile.createdBy.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                  <p className="text-sm">{new Date(selectedFile.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Departments</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedFile.departments.map((dept) => (
                    <Badge key={dept._id} variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {dept.name} ({dept.code})
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">File Attachment</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg mt-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{selectedFile.file.name}</span>
                    <span className="text-xs text-muted-foreground">({formatFileSize(selectedFile.file.size)})</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedFile.file.url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
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
              This action cannot be undone. This will permanently delete the file "{selectedFile?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete File"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
