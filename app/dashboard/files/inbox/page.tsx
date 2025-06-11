"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
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
  Building2,
  AlertTriangle,
  Settings,
  Shield,
  Clock,
  MessageSquare,
} from "lucide-react"
import { redirect, useRouter } from "next/navigation"

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
  signatures?: Array<{
    user: string
    signatureData: string
    signedAt: string
  }>
}

export default function InboxPageEnhanced() {
  const { toast } = useToast()
  const authContext = useAuth()
  const router = useRouter()

  const [files, setFiles] = useState<FileData[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([])
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [actionComment, setActionComment] = useState("")
  const [requireSignature, setRequireSignature] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [userSignature, setUserSignature] = useState<any>(null)

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Fetch user signature on component mount
  useEffect(() => {
    const fetchUserSignature = async () => {
      try {
        const savedSignature = localStorage.getItem("signatureData")
        if (savedSignature) {
          setUserSignature(JSON.parse(savedSignature))
        }
      } catch (error) {
        console.error("Error fetching user signature:", error)
      }
    }

    fetchUserSignature()
  }, [authContext])

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

    // Check if approval requires signature
    if (action === "approve" && selectedFile.requiresSignature) {
      if (!userSignature || !userSignature.hasSignature) {
        setShowSignatureDialog(true)
        return
      }

      // Check if user already signed this file
      const alreadySigned = selectedFile.signatures?.some((sig) => sig.user === authContext.user?.id)

      if (!alreadySigned) {
        // Add signature first
        try {
          const signatureResponse = await api.addSignature(
            selectedFile._id,
            { signatureData: userSignature.signatureUrl || userSignature.signatureText },
            authContext,
          )

          if (!signatureResponse.success) {
            toast({
              title: "Signature failed",
              description: "Failed to add signature to file",
              variant: "destructive",
            })
            return
          }
        } catch (error) {
          toast({
            title: "Signature failed",
            description: "Failed to add signature to file",
            variant: "destructive",
          })
          return
        }
      }
    }

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Format signature data
const formatSignature = (signature: any) => {
  if (!signature) return null
  
  // Try to parse signature data as JSON
  try {
    const sigData = JSON.parse(signature.signatureData)
    
    // If it's an object with imageUrl, return it as is
    if (sigData && sigData.imageUrl) {
      return sigData
    }
    
    // If it's just a string in JSON, return it
    if (typeof sigData === 'string') {
      return sigData
    }
    
    // If it's an object with text content, return that
    if (sigData && sigData.text) {
      return sigData.text
    }
    
    return sigData
  } catch (error) {
    // If parsing fails, return the raw data
    return signature.signatureData
  }
}

// const getPriorityColor = (priority: string) => {
//     if (bytes === 0) return "0 Bytes"
//     const k = 1024
//     const sizes = ["Bytes", "KB", "MB", "GB"]
//     const i = Math.floor(Math.log(bytes) / Math.log(k))
//     return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
//   }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "sent_back":
        return "bg-red-100 text-red-800 border-red-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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

  const handleGoToSettings = () => {
    setShowSignatureDialog(false)
    setShowReviewModal(false)
    router.push("/settings/signature")
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
                <Card key={file._id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
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
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                            <PenTool className="w-2 h-2 mr-1" />
                            {file.signatures && file.signatures.length > 0 
                              ? `Signed (${file.signatures.length})`
                              : 'Signature Required'}
                          </Badge>
                          
                          {/* Signature Status Indicator */}
                          {file.signatures && file.signatures.length > 0 && (
                            <div className="flex items-center gap-1">
                              {file.signatures.map((sig: any) => {
                                const user = file.sharedWith?.find((share: any) => share.user === sig.user)
                                if (!user) return null

                                // Get signature type based on role
                                const signatureType = user.role === 'department' ? 'dept' : 'admin'
                                
                                // Get status based on signature
                                const status = sig.user === authContext.user?.id ? 'current' : 'other'
                                
                                return (
                                  <div 
                                    key={sig._id} 
                                    className={`w-2 h-2 rounded-full ${
                                      status === 'current' 
                                        ? 'bg-blue-500' 
                                        : signatureType === 'dept' 
                                        ? 'bg-green-500' 
                                        : 'bg-purple-500'
                                    }`}
                                  />
                                )
                              })}
                            </div>
                          )}
                        </div>
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

      {/* Enhanced Review File Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              File Review & Approval
            </DialogTitle>
            <DialogDescription className="text-base">
              Review the file details and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <div className="space-y-6 py-4">
              {/* File Information Card */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {selectedFile.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                        <p className="text-sm mt-1 p-3 bg-slate-50 rounded-lg">{selectedFile.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                          <Badge variant="outline" className="mt-1 block w-fit">
                            {selectedFile.category}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                          <Badge className={`mt-1 block w-fit ${getPriorityColor(selectedFile.priority)}`}>
                            {selectedFile.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Submitted By</Label>
                        <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                          <p className="font-medium">
                            {selectedFile.createdBy.firstName} {selectedFile.createdBy.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{selectedFile.createdBy.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                          <Badge className={`mt-1 block w-fit ${getStatusColor(selectedFile.status)}`}>
                            {selectedFile.status}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                          <p className="text-sm mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(selectedFile.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Departments */}
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

                  {/* File Attachment */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">File Attachment</Label>
                    <div className="flex items-center justify-between p-3 border rounded-lg mt-1 bg-white">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{selectedFile.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(selectedFile.file.size)})
                        </span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedFile.file.url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Signature Requirements */}
                  {selectedFile.requiresSignature && (
                    <div className="space-y-4">
                      {/* Signature Requirement Info */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <PenTool className="w-4 h-4 text-blue-600" />
                          <Label className="text-sm font-medium text-blue-800">Digital Signature Required</Label>
                        </div>
                        <p className="text-sm text-blue-700">
                          This file requires a digital signature for approval. Your signature will be added automatically
                          when you approve.
                        </p>
                      </div>

                      {/* Department Signatures */}
                      {selectedFile.signatures && selectedFile.signatures.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Department Signatures</Label>
                          <div className="space-y-2 mt-2">
                            {selectedFile.signatures.map((sig: any) => {
                              const signature = formatSignature(sig)
                              const user = selectedFile.sharedWith?.find((share: any) => share.user === sig.user)
                              
                              if (!user || user.role !== 'department') return null

                              return (
                                <div key={sig._id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <p className="font-medium">
                                        {user.user.firstName} {user.user.lastName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">{user.user.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">
                                      Signed on: {new Date(sig.signedAt).toLocaleString()}
                                    </p>
                                    {signature && (
                                      <div className="mt-1">
                                        <p className="text-sm text-blue-600">Signature Preview:</p>
                                        <div className="mt-1 p-2 bg-white border rounded">
                                          {typeof signature === 'string' ? (
                                            <p className="text-sm">{signature}</p>
                                          ) : (
                                            <img 
                                              src={signature.imageUrl} 
                                              alt="Signature"
                                              className="w-24 h-12 object-contain"
                                            />
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Admin Signatures */}
                      {selectedFile.signatures && selectedFile.signatures.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Admin Signatures</Label>
                          <div className="space-y-2 mt-2">
                            {selectedFile.signatures.map((sig: any) => {
                              const signature = formatSignature(sig)
                              const user = selectedFile.sharedWith?.find((share: any) => share.user === sig.user)
                              
                              if (!user || user.role !== 'admin') return null

                              return (
                                <div key={sig._id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <p className="font-medium">
                                        {user.user.firstName} {user.user.lastName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">{user.user.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">
                                      Signed on: {new Date(sig.signedAt).toLocaleString()}
                                    </p>
                                    {signature && (
                                      <div className="mt-1">
                                        <p className="text-sm text-blue-600">Signature Preview:</p>
                                        <div className="mt-1 p-2 bg-white border rounded">
                                          {typeof signature === 'string' ? (
                                            <p className="text-sm">{signature}</p>
                                          ) : (
                                            <img 
                                              src={signature.imageUrl} 
                                              alt="Signature"
                                              className="w-24 h-12 object-contain"
                                            />
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review Actions Card */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    Review Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Approval Status */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Approval Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {selectedFile?.approvalStatus || 'pending'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(selectedFile?.updatedAt || selectedFile?.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Department Approvals */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Department Approvals</Label>
                    <div className="space-y-2">
                      {selectedFile?.departments?.map((dept) => (
                        <div key={dept._id} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Building2 className="w-3 h-3 mr-1" />
                            {dept.name} ({dept.code})
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            Status: {selectedFile?.status || 'pending'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Director Approvals */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Director Approvals</Label>
                    <div className="space-y-2">
                      {selectedFile?.sharedWith?.filter(share => share.user.role === 'director').map((share) => (
                        <div key={share._id} className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {share.user.firstName} {share.user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{share.user.email}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Status: {selectedFile?.status || 'pending'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comment Section */}
                  <div className="space-y-2">
                    <Label htmlFor="action-comment" className="text-sm font-medium">
                      Review Comment
                    </Label>
                    <Textarea
                      id="action-comment"
                      placeholder="Add your review comments here..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comments are required for reject and send back actions
                    </p>
                  </div>

                  {/* Signature Requirement Toggle */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                    <div className="space-y-1">
                      <Label htmlFor="require-signature" className="text-sm font-medium">
                        Require Digital Signature
                      </Label>
                      <p className="text-xs text-muted-foreground">Require signature before final approval</p>
                    </div>
                    <Switch id="require-signature" checked={requireSignature} onCheckedChange={setRequireSignature} />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowReviewModal(false)} disabled={isProcessing}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleFileAction("sendback")}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-2" />
                      )}
                      Send Back
                    </Button>
                    <Button
                      onClick={() => handleFileAction("reject")}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleFileAction("approve")}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Required Dialog */}
      <AlertDialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Signature Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This file requires a digital signature for approval.</p>
              <p className="text-sm">
                You need to set up your digital signature in settings before you can approve files that require
                signatures.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToSettings} className="bg-blue-600 hover:bg-blue-700">
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Edit File Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit File: {selectedFile?.title}</DialogTitle>
            <DialogDescription>Update file information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Edit functionality would be implemented here based on your file editing requirements.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowEditModal(false)}>Save Changes</Button>
            </div>
          </div>
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
