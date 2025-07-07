"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
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
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  User,
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
  Plus,
  RefreshCw,
  SortAsc,
  SortDesc,
  ImageIcon,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive,
} from "lucide-react"
import { redirect, useRouter } from "next/navigation"

interface FileData {
  _id: string
  title: string
  description: string
  category: string
  priority?: string
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
  }
  departments: Array<{
    _id: string
    name: string
    code: string
  }>
  createdAt: string
  updatedAt: string
  sharedWith?: Array<{
    user: {
      _id: string
      firstName: string
      lastName: string
      email: string
      role: string
    }
    permission: string
    sharedAt: string
  }>
  signatures?: Array<{
    _id: string
    user: string
    signatureData: string
    signedAt: string
  }>
}

type SortOption = "name" | "date" | "size" | "type" | "priority"
type SortDirection = "asc" | "desc"

export default function InboxPage() {
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [userSignature, setUserSignature] = useState<any>(null)

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [showAddSignatureDialog, setShowAddSignatureDialog] = useState(false)

  // Signature states
  const [signatureText, setSignatureText] = useState("")
  const [isAddingSignature, setIsAddingSignature] = useState(false)

  // Get theme colors based on user role
  const getThemeColor = () => {
    switch (authContext.user?.role) {
      case "admin":
        return {
          primary: "orange-600",
          primaryHover: "orange-700",
          bg: "orange-50",
          text: "orange-600",
          badge: "orange-100",
          badgeText: "orange-800",
        }
      case "director":
        return {
          primary: "red-600",
          primaryHover: "red-700",
          bg: "red-50",
          text: "red-600",
          badge: "red-100",
          badgeText: "red-800",
        }
      case "department":
        return {
          primary: "green-600",
          primaryHover: "green-700",
          bg: "green-50",
          text: "green-600",
          badge: "green-100",
          badgeText: "green-800",
        }
      default:
        return {
          primary: "blue-600",
          primaryHover: "blue-700",
          bg: "blue-50",
          text: "blue-600",
          badge: "blue-100",
          badgeText: "blue-800",
        }
    }
  }

  const themeColors = getThemeColor()

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Get file icon based on file type
  const getFileIcon = (fileType: string, fileName: string) => {
    const type = fileType?.toLowerCase() || ""
    const extension = fileName?.split(".").pop()?.toLowerCase() || ""

    if (type.includes("image") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />
    }
    if (type.includes("video") || ["mp4", "avi", "mov", "wmv", "flv"].includes(extension)) {
      return <FileVideo className="w-8 h-8 text-purple-500" />
    }
    if (type.includes("audio") || ["mp3", "wav", "flac", "aac"].includes(extension)) {
      return <FileAudio className="w-8 h-8 text-green-500" />
    }
    if (["xlsx", "xls", "csv"].includes(extension)) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
      return <Archive className="w-8 h-8 text-orange-500" />
    }
    return <FileText className="w-8 h-8 text-gray-500" />
  }

  // Fetch user signature on component mount
  useEffect(() => {
    const fetchUserSignature = async () => {
      try {
        const response = await api.getUserSignature(authContext)
        if (response.success && response.signature) {
          const signature = response.signature
          setUserSignature({
            enabled: signature.enabled,
            type: signature.type,
            data: signature.data,
            cloudinaryId: signature.cloudinaryId,
            updatedAt: signature.updatedAt,
          })
        }
      } catch (error) {
        console.error("Error fetching user signature:", error)
      }
    }

    if (authContext.isAuthenticated) {
      fetchUserSignature()
    }
  }, [authContext])

  // Fetch inbox files
  const fetchInboxFiles = async () => {
    try {
      setLoading(true)
      const response = await api.getInboxFiles(authContext)
      if (response.success && response.data) {
        // Process and sanitize files data
        const filesData = response.data.files || []
        const processedFiles = filesData.map((file: any) => ({
          ...file,
          title: file.title || "Untitled",
          description: file.description || "No description",
          category: file.category || "Uncategorized",
          status: file.status || "pending",
          priority: file.priority || "medium",
          createdBy: {
            _id: file.createdBy?._id || "",
            firstName: file.createdBy?.firstName || "Unknown",
            lastName: file.createdBy?.lastName || "User",
            email: file.createdBy?.email || "",
          },
          file: {
            name: file.file?.name || "Unknown file",
            url: file.file?.url || "",
            size: file.file?.size || 0,
            type: file.file?.type || "",
          },
          departments: file.departments || [],
          signatures: file.signatures || [],
        }))
        setFiles(processedFiles)
        setFilteredFiles(processedFiles)
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

  useEffect(() => {
    fetchInboxFiles()
  }, [authContext])

  // Search and sort files
  useEffect(() => {
    const filtered = files.filter((file) => {
      const title = file.title || ""
      const fileName = file.file?.name || ""
      const category = file.category || ""
      const firstName = file.createdBy?.firstName || ""
      const lastName = file.createdBy?.lastName || ""

      return (
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    // Sort files
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "name":
          aValue = (a.title || "").toLowerCase()
          bValue = (b.title || "").toLowerCase()
          break
        case "date":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case "size":
          aValue = a.file?.size || 0
          bValue = b.file?.size || 0
          break
        case "type":
          aValue = (a.file?.type || "").toLowerCase()
          bValue = (b.file?.type || "").toLowerCase()
          break
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        default:
          return 0
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredFiles(filtered)
  }, [files, searchTerm, sortBy, sortDirection])

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  // Fixed priority color function with null checks
  const getPriorityColor = (priority?: string | null) => {
    if (!priority) return "bg-gray-100 text-gray-800"

    switch (priority.toLowerCase()) {
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

  // Fixed status color function with null checks
  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800"

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

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(option)
      setSortDirection("asc")
    }
  }

  // Add signature to file
  const handleAddSignature = async () => {
    if (!selectedFile || !signatureText.trim()) {
      toast({
        title: "Missing signature",
        description: "Please provide your signature",
        variant: "destructive",
      })
      return
    }

    setIsAddingSignature(true)
    try {
      const signatureData = userSignature?.enabled && userSignature?.data ? userSignature.data : signatureText

      const response = await api.addSignature(selectedFile._id, { signatureData }, authContext)

      if (response.success) {
        // Update local state
        setFiles((prev) =>
          prev.map((file) =>
            file._id === selectedFile._id
              ? {
                  ...file,
                  signatures: [
                    ...(file.signatures || []),
                    {
                      _id: Date.now().toString(),
                      user: authContext.user?.id || "",
                      signatureData,
                      signedAt: new Date().toISOString(),
                    },
                  ],
                }
              : file,
          ),
        )

        setShowAddSignatureDialog(false)
        setSignatureText("")
        toast({
          title: "Signature added",
          description: "Your signature has been added to the file",
        })
      } else {
        throw new Error(response.error || "Failed to add signature")
      }
    } catch (error: any) {
      toast({
        title: "Signature failed",
        description: error.message || "Failed to add signature",
        variant: "destructive",
      })
    } finally {
      setIsAddingSignature(false)
    }
  }

  const handleFileAction = async (action: "approve" | "reject" | "sendback") => {
    if (!selectedFile) return

    // Check if approval requires signature and user hasn't signed yet
    if (action === "approve" && selectedFile.requiresSignature) {
      const userHasSigned = selectedFile.signatures?.some((sig) => sig.user === authContext.user?.id)

      if (!userHasSigned) {
        if (!userSignature?.enabled) {
          setShowSignatureDialog(true)
          return
        }

        // Show add signature dialog
        setShowAddSignatureDialog(true)
        return
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
        ...(action === "approve" && selectedFile.requiresSignature && userSignature?.enabled
          ? { signatureData: userSignature.data }
          : {}),
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

  const openViewModal = (file: FileData) => {
    setSelectedFile(file)
    setShowViewModal(true)
  }

  const openDeleteDialog = (file: FileData) => {
    setSelectedFile(file)
    setShowDeleteDialog(true)
  }

  const openReviewModal = (file: FileData) => {
    setSelectedFile(file)
    setShowReviewModal(true)
  }

  const openAddSignatureDialog = (file: FileData) => {
    setSelectedFile(file)
    setShowAddSignatureDialog(true)
  }

  const handleGoToSettings = () => {
    setShowSignatureDialog(false)
    setShowReviewModal(false)
    router.push("/dashboard/settings/signature")
  }

  // Check if user has already signed the file
  const hasUserSigned = (file: FileData) => {
    return file.signatures?.some((sig) => sig.user === authContext.user?.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`h-8 w-8 animate-spin text-${themeColors.text}`} />
        <span className="ml-2 text-gray-600">Loading inbox files...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">File Inbox</h1>
          <p className="text-slate-600 mt-1">Review and approve files shared with your department</p>
          {authContext.user?.role && (
            <Badge className={`mt-2 bg-${themeColors.badge} text-${themeColors.badgeText}`}>
              {authContext.user.role.toUpperCase()} INBOX
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInboxFiles}
            disabled={loading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge variant="outline" className={`text-${themeColors.text} border-${themeColors.text}`}>
            {filteredFiles.length} Files
          </Badge>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search inbox files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortDirection === "asc" ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                Sort by {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleSort("name")}>
                Name {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("date")}>
                Date {sortBy === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("priority")}>
                Priority {sortBy === "priority" && (sortDirection === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("size")}>
                Size {sortBy === "size" && (sortDirection === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? `bg-${themeColors.primary} hover:bg-${themeColors.primaryHover}` : ""}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? `bg-${themeColors.primary} hover:bg-${themeColors.primaryHover}` : ""}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* File Display */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              {searchTerm ? "No files found" : "No files in inbox"}
            </h3>
            <p className="text-slate-600">
              {searchTerm ? "Try adjusting your search terms" : "No files have been shared with your department yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredFiles.map((file) => (
                <Card
                  key={file._id}
                  className="hover:shadow-md transition-all cursor-pointer group relative"
                  onClick={() => openViewModal(file)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="mb-3 flex justify-center">{getFileIcon(file.file.type, file.file.name)}</div>
                    <h3 className="font-medium text-sm truncate mb-1" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">{formatFileSize(file.file.size)}</p>
                    <p className="text-xs text-slate-400">{formatDate(file.createdAt)}</p>

                    {/* Status and Priority Badges */}
                    {/* <div className="flex flex-wrap gap-1 mt-2 justify-center">
                      <Badge className={`text-xs ${getStatusColor(file.status)}`}>{file.status || "Unknown"}</Badge>
                      {file.priority && (
                        <Badge className={`text-xs ${getPriorityColor(file.priority)}`}>{file.priority}</Badge>
                      )}
                    </div> */}

                    {/* Action Menu */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white shadow-sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => openViewModal(file)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem onClick={() => openReviewModal(file)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Review & Approve
                          </DropdownMenuItem>
                          {file.requiresSignature && !hasUserSigned(file) && (
                            <DropdownMenuItem onClick={() => openAddSignatureDialog(file)}>
                              <PenTool className="w-4 h-4 mr-2" />
                              Add Signature
                            </DropdownMenuItem>
                          )} */}
                          <DropdownMenuItem asChild>
                            <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(file)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status Indicators */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {file.requiresSignature && (
                        <Badge
                          variant="secondary"
                          className={`text-xs px-1 py-0 ${
                            hasUserSigned(file) ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          <PenTool className="w-2 h-2 mr-1" />
                          {hasUserSigned(file) ? "Signed" : "Sign"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredFiles.map((file) => (
                    <div
                      key={file._id}
                      className="flex items-center p-4 hover:bg-slate-50 cursor-pointer group"
                      onClick={() => openViewModal(file)}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="mr-3">{getFileIcon(file.file.type, file.file.name)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{file.name}</h3>
                          <p className="text-sm text-slate-500 truncate">{file.description}</p>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center space-x-6 text-sm text-slate-500">
                        <span className="w-20 text-right">{formatFileSize(file.file.size)}</span>
                        {/* <span className="w-24">{file.category}</span> */}
                        {/* <div className="w-32 flex flex-col">
                          <Badge className={`text-xs ${getStatusColor(file.status)} mb-1`}>
                            {file.status || "Unknown"}
                          </Badge>
                          {file.priority && (
                            <Badge className={`text-xs ${getPriorityColor(file.priority)}`}>{file.priority}</Badge>
                          )}
                        </div> */}
                        <span className="w-24">{formatDate(file.createdAt)}</span>
                      </div>

                      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => openViewModal(file)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem onClick={() => openReviewModal(file)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Review & Approve
                            </DropdownMenuItem>
                            {file.requiresSignature && !hasUserSigned(file) && (
                              <DropdownMenuItem onClick={() => openAddSignatureDialog(file)}>
                                <PenTool className="w-4 h-4 mr-2" />
                                Add Signature
                              </DropdownMenuItem>
                            )} */}
                            <DropdownMenuItem asChild>
                              <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(file)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* View File Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFile && getFileIcon(selectedFile.file.type, selectedFile.file.name)}
              {selectedFile?.name}
            </DialogTitle>
            <DialogDescription>File details and information</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Name</Label>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Size</Label>
                  <p className="text-sm font-medium">{formatFileSize(selectedFile.file.size)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedFile.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="text-sm">{selectedFile.category}</p>
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
                  {selectedFile.sharedWith.map((dept) => (
                    <Badge key={dept._id} variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {dept.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" asChild className="flex-1 bg-transparent">
                  <a href={selectedFile.file.url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
                {/* <Button
                  variant="outline"
                  onClick={() => openReviewModal(selectedFile)}
                  className={`flex-1 bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Review & Approve
                </Button> */}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Review File Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className={`w-6 h-6 text-${themeColors.text}`} />
              File Review & Approval
            </DialogTitle>
            <DialogDescription className="text-base">
              Review the file details and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <div className="space-y-6 py-4">
              {/* File Information Card */}
              <Card className={`border-l-4 border-l-${themeColors.primary}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className={`w-5 h-5 text-${themeColors.text}`} />
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
                            {selectedFile.priority || "Not set"}
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
                        <FileText className={`w-4 h-4 text-${themeColors.text}`} />
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
                      <div className={`p-4 bg-${themeColors.bg} border border-${themeColors.primary} rounded-lg`}>
                        <div className="flex items-center gap-2 mb-2">
                          <PenTool className={`w-4 h-4 text-${themeColors.text}`} />
                          <Label className={`text-sm font-medium text-${themeColors.text}`}>
                            Digital Signature Required
                          </Label>
                        </div>
                        <p className={`text-sm text-${themeColors.text}`}>
                          This file requires a digital signature for approval.
                          {hasUserSigned(selectedFile)
                            ? " You have already signed this file."
                            : " Please add your signature before approving."}
                        </p>
                        {!hasUserSigned(selectedFile) && (
                          <Button
                            size="sm"
                            className={`mt-2 bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
                            onClick={() => openAddSignatureDialog(selectedFile)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Signature
                          </Button>
                        )}
                      </div>

                      {/* Existing Signatures */}
                      {selectedFile.signatures && selectedFile.signatures.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Signatures ({selectedFile.signatures.length})
                          </Label>
                          <div className="space-y-2 mt-2">
                            {selectedFile.signatures.map((sig) => (
                              <div key={sig._id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <User className={`w-4 h-4 text-${themeColors.text}`} />
                                  <div>
                                    <p className="font-medium">{sig.user === authContext.user?.id ? "You" : "User"}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Signed on: {new Date(sig.signedAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="mt-1 p-2 bg-white border rounded">
                                    {sig.signatureData.startsWith("data:image") ? (
                                      <img
                                        src={sig.signatureData || "/placeholder.svg"}
                                        alt="Signature"
                                        className="w-24 h-12 object-contain"
                                      />
                                    ) : (
                                      <p className="text-sm font-script">{sig.signatureData}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
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

      {/* Add Signature Dialog */}
      {/* <Dialog open={showAddSignatureDialog} onOpenChange={setShowAddSignatureDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className={`w-5 h-5 text-${themeColors.text}`} />
              Add Your Signature
            </DialogTitle>
            <DialogDescription>Add your digital signature to approve this file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {userSignature?.enabled ? (
              <div className="space-y-3">
                <Label>Your Saved Signature</Label>
                <div className="p-4 border rounded-lg bg-slate-50">
                  {userSignature.type === "draw" ? (
                    <img
                      src={userSignature.data || "/placeholder.svg"}
                      alt="Your signature"
                      className="max-w-full h-16 object-contain"
                    />
                  ) : (
                    <p className="font-script text-lg">{userSignature.data}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">This signature will be used for the file approval.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="signature-text">Type Your Signature</Label>
                <Input
                  id="signature-text"
                  placeholder="Enter your full name as signature"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="font-script text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  You can set up a permanent signature in settings for future use.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowAddSignatureDialog(false)} disabled={isAddingSignature}>
              Cancel
            </Button>
            <Button onClick={() => router.push("/dashboard/settings/signature")} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Signature Settings
            </Button>
            <Button
              onClick={handleAddSignature}
              disabled={isAddingSignature || (!userSignature?.enabled && !signatureText.trim())}
              className={`bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
            >
              {isAddingSignature ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 mr-2" />
                  Add Signature
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}

      {/* Signature Required Dialog */}
      {/* <AlertDialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
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
            <AlertDialogAction
              onClick={handleGoToSettings}
              className={`bg-${themeColors.primary} hover:bg-${themeColors.primaryHover}`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFile?.title}"? This action cannot be undone.
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
