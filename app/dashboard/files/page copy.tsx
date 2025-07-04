"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import {
  FileText,
  Plus,
  Inbox,
  Share,
  Send,
  Search,
  Download,
  Calendar,
  User,
  Loader2,
  Building2,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Grid3X3,
  List,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

interface FileData {
  _id: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  file: {
    name: string
    url: string
    size: number
  }
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
  departments: Array<{
    _id: string
    name: string
    code: string
  }>
  requiresSignature?: boolean
}

export default function FilesPageEnhanced() {
  const authContext = useAuth()
  const { toast } = useToast()

  const [allFiles, setAllFiles] = useState<FileData[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [isProcessing, setIsProcessing] = useState(false)

  // Selected file and modal states
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Fetch all files based on user role
  useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        setLoading(true)

        // Get user info first to determine permissions
        const userResponse = await api.getUser(authContext)
        if (!userResponse.success || !userResponse.data) {
          throw new Error("Failed to fetch user information")
        }

        const user = userResponse.data
        const queryParams: any = {}

        // Filter files based on user role
        if (user.role === "admin") {
          // Admin sees all files
          queryParams.role = "admin"
        } else if (user.role === "department" || user.role === "director") {
          // Department staff/director sees files in their department
          const departmentId = Array.isArray(user.department) ? user.department[0] : user.department
          if (departmentId) {
            queryParams.department = departmentId
          }
        }

        const response = await api.getFiles(queryParams, authContext)

        if (response.success && response.data) {
          setAllFiles(response.data.files || [])
          setFilteredFiles(response.data.files || [])
        }
      } catch (error) {
        console.error("Error fetching files:", error)
        toast({
          title: "Error",
          description: "Failed to load files",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAllFiles()
  }, [authContext, toast])

  // Filter files based on search term and status
  useEffect(() => {
    const filtered = allFiles.filter((file) => {
      const matchesSearch =
        file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.createdBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.createdBy.lastName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || file.status.toLowerCase() === filterStatus.toLowerCase()
      return matchesSearch && matchesStatus
    })
    setFilteredFiles(filtered)
  }, [allFiles, searchTerm, filterStatus])

  const handleDeleteFile = async () => {
    if (!selectedFile) return

    try {
      setIsProcessing(true)
      const response = await api.deleteFile(selectedFile._id, authContext)

      if (response.success) {
        setAllFiles((prev) => prev.filter((file) => file._id !== selectedFile._id))
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "sent_back":
        return "bg-red-100 text-red-800"
      case "rejected":
        return "bg-gray-100 text-gray-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileStats = () => {
    return {
      total: allFiles.length,
      draft: allFiles.filter((f) => f.status === "draft").length,
      pending: allFiles.filter((f) => f.status === "pending").length,
      approved: allFiles.filter((f) => f.status === "approved").length,
      active: allFiles.filter((f) => f.status === "active").length,
    }
  }

  const fileStats = getFileStats()

  const getStatusCounts = () => {
    return {
      all: allFiles.length,
      draft: allFiles.filter((f) => f.status.toLowerCase() === "draft").length,
      active: allFiles.filter((f) => f.status.toLowerCase() === "active").length,
      pending: allFiles.filter((f) => f.status.toLowerCase() === "pending").length,
      approved: allFiles.filter((f) => f.status.toLowerCase() === "approved").length,
      rejected: allFiles.filter((f) => f.status.toLowerCase() === "rejected").length,
      sent_back: allFiles.filter((f) => f.status.toLowerCase() === "sent_back").length,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">File Management</h1>
          <p className="text-slate-600 mt-1">
            {authContext.user?.role === "admin"
              ? "Manage all files across departments"
              : "Manage your files and documents"}
          </p>
        </div>
        <Link href="/files/create">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Create New File
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Files</p>
                <p className="text-2xl font-bold text-slate-800">{fileStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-purple-100">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Drafts</p>
                <p className="text-2xl font-bold text-slate-800">{fileStats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-orange-100">
                <Inbox className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-slate-800">{fileStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-green-100">
                <Share className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Approved</p>
                <p className="text-2xl font-bold text-slate-800">{fileStats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common file management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/files/create">
              <Button variant="outline" className="w-full h-20 flex-col">
                <Plus className="w-6 h-6 mb-2" />
                Create New File
              </Button>
            </Link>
            <Link href="/files/inbox">
              <Button variant="outline" className="w-full h-20 flex-col">
                <Inbox className="w-6 h-6 mb-2" />
                Review Inbox
              </Button>
            </Link>
            <Link href="/files/share">
              <Button variant="outline" className="w-full h-20 flex-col">
                <Send className="w-6 h-6 mb-2" />
                Share Drafts
              </Button>
            </Link>
            <Link href="/files/shared">
              <Button variant="outline" className="w-full h-20 flex-col">
                <Share className="w-6 h-6 mb-2" />
                Track Shared
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

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

      {/* All Files by Status */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
          <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
          <TabsTrigger value="sent_back">Sent Back ({statusCounts.sent_back})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="space-y-4">
          {filteredFiles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">No files found</h3>
                <p className="text-slate-600">
                  {searchTerm || filterStatus !== "all"
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
                              <DropdownMenuItem onClick={() => openEditModal(file)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit File
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openShareModal(file)}>
                                <Share className="w-4 h-4 mr-2" />
                                Share File
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(file)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
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
                        </div>

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
                          <TableHead>From</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
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
                              {file.priority && (
                                <Badge className={getPriorityColor(file.priority)}>{file.priority}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                            </TableCell>
                            <TableCell>{new Date(file.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => openViewModal(file)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openEditModal(file)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openShareModal(file)}>
                                  <Share className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(file)}
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
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

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
                  <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                  {selectedFile.priority ? (
                    <Badge className={getPriorityColor(selectedFile.priority)}>{selectedFile.priority}</Badge>
                  ) : (
                    <p className="text-sm">Not specified</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedFile.status)}>{selectedFile.status}</Badge>
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
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowViewModal(false)
                    openEditModal(selectedFile)
                  }}
                >
                  Edit File
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit File Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit File: {selectedFile?.title}</DialogTitle>
            <DialogDescription>Update file information</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" defaultValue={selectedFile.title} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" defaultValue={selectedFile.category} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} defaultValue={selectedFile.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="w-full p-2 border rounded-md"
                    defaultValue={selectedFile.priority || ""}
                  >
                    <option value="">Select Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" className="w-full p-2 border rounded-md" defaultValue={selectedFile.status}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="sent_back">Sent Back</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "File updated",
                      description: "File has been updated successfully",
                    })
                    setShowEditModal(false)
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share File Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share File: {selectedFile?.title}</DialogTitle>
            <DialogDescription>Share this file with departments or users</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Select Departments</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <input type="checkbox" id="dept1" className="rounded" />
                    <Label htmlFor="dept1" className="cursor-pointer">
                      Human Resources (HR)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <input type="checkbox" id="dept2" className="rounded" />
                    <Label htmlFor="dept2" className="cursor-pointer">
                      Finance (FIN)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <input type="checkbox" id="dept3" className="rounded" />
                    <Label htmlFor="dept3" className="cursor-pointer">
                      Information Technology (IT)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <input type="checkbox" id="dept4" className="rounded" />
                    <Label htmlFor="dept4" className="cursor-pointer">
                      Operations (OPS)
                    </Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-message">Message (Optional)</Label>
                <Textarea id="share-message" placeholder="Add a message for the recipients..." rows={3} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowShareModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "File shared",
                      description: "File has been shared successfully",
                    })
                    setShowShareModal(false)
                  }}
                >
                  Share File
                </Button>
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
