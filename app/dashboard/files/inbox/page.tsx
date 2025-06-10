"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Inbox,
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  User,
  Calendar,
  PenTool,
  Loader2,
  Search,
  MoreHorizontal,
  Grid3X3,
  List,
  Share,
} from "lucide-react"
import { redirect } from "next/navigation"

interface FileData {
  _id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  requiresSignature: boolean
  file: {
    name: string
    url: string
    size: number
    type: string
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
  createdAt: string
  updatedAt: string
  sharedWith?: Array<{
    user: string
    permission: string
    sharedAt: string
  }>
}

export default function InboxPageEnhanced() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [files, setFiles] = useState<FileData[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([])
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [actionComment, setActionComment] = useState("")
  const [requireSignature, setRequireSignature] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "table">("card")

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Fetch inbox files (files shared with user's department)
  useEffect(() => {
    const fetchInboxFiles = async () => {
      try {
        setLoading(true)
        const response = await api.getInboxFiles(authContext)

        if (response.success && response.data) {
          setFiles(response.data.files || [])
          setFilteredFiles(response.data.files || [])
        }
      } catch (error) {
        console.error("Error fetching inbox files:", error)
        toast({
          title: "Error",
          description: "Failed to load inbox files",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInboxFiles()
  }, [authContext, toast])

  // Filter files based on search term
  useEffect(() => {
    const filtered = files.filter(
      (file) =>
        file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.createdBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.createdBy.lastName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredFiles(filtered)
  }, [files, searchTerm])

  const handleFileAction = async (action: "approve" | "reject" | "sendback") => {
    if (!selectedFile) return

    if (!actionComment.trim() && action !== "approve") {
      toast({
        title: "Comment required",
        description: "Please provide a comment for this action",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const actionData = {
        action,
        comment: actionComment,
        requiresSignature: action === "approve" ? requireSignature : false,
      }

      const response = await api.takeFileAction(selectedFile._id, actionData, authContext)

      if (response.success) {
        const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "sent_back"

        // Update local state
        setFiles((prev) => prev.map((file) => (file._id === selectedFile._id ? { ...file, status: newStatus } : file)))

        setSelectedFile(null)
        setActionComment("")
        setRequireSignature(false)
        setShowReviewModal(false)

        toast({
          title: `File ${action}d successfully`,
          description: `${selectedFile.title} has been ${action}d`,
        })
      } else {
        throw new Error(response.error || `Failed to ${action} file`)
      }
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message || `Failed to ${action} file`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

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

  const handleForwardFile = async () => {
    if (!selectedFile) return

    try {
      setIsProcessing(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setShowForwardModal(false)
      setSelectedFile(null)
      toast({
        title: "Success",
        description: "File forwarded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to forward file",
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approve":
        return CheckCircle
      case "reject":
        return XCircle
      case "sendback":
        return RotateCcw
      default:
        return CheckCircle
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "approve":
        return "bg-green-500 hover:bg-green-600"
      case "reject":
        return "bg-red-500 hover:bg-red-600"
      case "sendback":
        return "bg-orange-500 hover:bg-orange-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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

  const openReviewModal = (file: FileData) => {
    setSelectedFile(file)
    setShowReviewModal(true)
  }

  const openForwardModal = (file: FileData) => {
    setSelectedFile(file)
    setShowForwardModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading inbox files...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">File Inbox</h1>
          <p className="text-slate-600 mt-1">Review and approve files shared with your department</p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          {filteredFiles.length} Files
        </Badge>
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
            <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No files in inbox</h3>
            <p className="text-slate-600">
              {searchTerm
                ? "No files match your search criteria"
                : "No files have been shared with your department yet"}
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
                        <div className="p-2 rounded-full bg-orange-100">
                          <FileText className="w-5 h-5 text-orange-600" />
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
                          <DropdownMenuItem onClick={() => openReviewModal(file)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Review & Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openForwardModal(file)}>
                            <Share className="w-4 h-4 mr-2" />
                            Forward
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
                      <Badge className={`text-xs ${getPriorityColor(file.priority)}`}>{file.priority}</Badge>
                      <Badge className={`text-xs ${getStatusColor(file.status)}`}>{file.status}</Badge>
                      {file.requiresSignature && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                          <PenTool className="w-2 h-2 mr-1" />
                          Signature
                        </Badge>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{file.file.name}</span>
                        <span>{formatFileSize(file.file.size)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openReviewModal(file)} className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        Review
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
                            <div className="p-2 rounded-full bg-orange-100">
                              <FileText className="w-4 h-4 text-orange-600" />
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
                          <Badge className={getPriorityColor(file.priority)}>{file.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                            {file.requiresSignature && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                <PenTool className="w-3 h-3" />
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
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(file)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openReviewModal(file)}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openForwardModal(file)}>
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
                  <Badge className={getPriorityColor(selectedFile.priority)}>{selectedFile.priority}</Badge>
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
                  <p className="text-sm">{new Date(selectedFile.createdAt).toLocaleDateString()}</p>\
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">File Name</Label>
                <p className="text-sm">{selectedFile.file.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">File Size</Label>
                <p className="text-sm">{formatFileSize(selectedFile.file.size)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Download File</Label>
                <Button variant="outline" asChild>
                  <a href={selectedFile.file.url} target="_blank" rel="noopener noreferrer">
                    Download
                    <Download className="w-4 h-4 ml-2" />
                  </a>
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
            <DialogDescription>Make changes to this file</DialogDescription>
          </DialogHeader>
          <div>
            <p>This feature is under development.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review File Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review File: {selectedFile?.title}</DialogTitle>
            <DialogDescription>Approve, reject, or send back this file</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Input
                id="comment"
                placeholder="Add a comment"
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
              />
            </div>

            {selectedFile?.requiresSignature && (
              <div className="flex items-center space-x-2">
                <Input
                  id="signature-required"
                  type="checkbox"
                  checked={requireSignature}
                  onChange={(e) => setRequireSignature(e.target.checked)}
                />
                <Label htmlFor="signature-required">Require Signature</Label>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className={getActionColor("sendback")}
                onClick={() => handleFileAction("sendback")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Send Back
                  </>
                )}
              </Button>
              <Button
                type="button"
                className={getActionColor("reject")}
                onClick={() => handleFileAction("reject")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </>
                )}
              </Button>
              <Button
                type="button"
                className={getActionColor("approve")}
                onClick={() => handleFileAction("approve")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forward File Modal */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forward File: {selectedFile?.title}</DialogTitle>
            <DialogDescription>Forward this file to another department</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="Select a department" disabled />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={() => setShowForwardModal(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => handleForwardFile()} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  <>
                    <Share className="mr-2 h-4 w-4" />
                    Forward
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete File Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete File: {selectedFile?.title}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteFile} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
