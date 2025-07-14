"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  Download,
  PenTool,
  Loader2,
  Search,
  MoreHorizontal,
  Grid3X3,
  List,
  Building2,
  RefreshCw,
  SortAsc,
  SortDesc,
  ImageIcon,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive,
  Folder,
  Globe,
  Lock,
  Users,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { redirect, useRouter } from "next/navigation"

interface FileData {
  _id: string
  name: string
  title: string
  description: string
  category: string
  priority?: string
  status: string
  requiresSignature?: boolean
  folder?: {
    _id: string
    name: string
    description?: string
  }
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
  sharedWithMe?: boolean
}

interface FolderData {
  _id: string
  name: string
  description: string
  isDefault: boolean
  accessLevel: "public" | "department" | "private"
  fileCount: number
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
  canEdit?: boolean
  canDelete?: boolean
  canShare?: boolean
  createdAt: string
  updatedAt: string
  sharedWith?: Array<{
    type: string
    userId?: {
      _id: string
      firstName: string
      lastName: string
      email: string
    }
    departmentId?: {
      _id: string
      name: string
      code: string
    }
    permission: string
    sharedAt: string
  }>
  sharedWithMe?: boolean
}

type SortOption = "name" | "date" | "size" | "type" | "priority"
type SortDirection = "asc" | "desc"

export default function InboxPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const router = useRouter()

  const [files, setFiles] = useState<FileData[]>([])
  const [folders, setFolders] = useState<FolderData[]>([])
  const [filteredItems, setFilteredItems] = useState<(FileData | FolderData)[]>([])
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null)
  const [actionComment, setActionComment] = useState("")
  const [requireSignature, setRequireSignature] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [userSignature, setUserSignature] = useState<any>(null)
  const [currentFolder, setCurrentFolder] = useState<FolderData | null>(null)
  const [folderFiles, setFolderFiles] = useState<FileData[]>([])

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFolderViewModal, setShowFolderViewModal] = useState(false)
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

  // Get folder icon based on access level
  const getFolderIcon = (accessLevel: string, isDefault = false) => {
    if (isDefault) {
      return <Folder className="w-8 h-8 text-blue-600" />
    }
    switch (accessLevel) {
      case "public":
        return <Globe className="w-8 h-8 text-green-600" />
      case "private":
        return <Lock className="w-8 h-8 text-red-600" />
      default:
        return <Users className="w-8 h-8 text-orange-600" />
    }
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

  // Fetch inbox files and folders
  const fetchInboxData = async () => {
    try {
      setLoading(true)

      // Fetch both files and folders in parallel
      const [filesResponse, foldersResponse] = await Promise.all([
        api.getInboxFiles(authContext),
        api.getInboxFolders(authContext),
      ])

      // Process files
      if (filesResponse.success && filesResponse.data) {
        const filesData = filesResponse.data.files || []
        const processedFiles = filesData.map((file: any) => ({
          ...file,
          name: file.name || file.title || "Untitled",
          title: file.title || file.name || "Untitled",
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
          folder: file.folder || null,
          departments: file.departments || [],
          signatures: file.signatures || [],
          sharedWithMe: true,
        }))
        setFiles(processedFiles)
      } else {
        console.warn("No files data received:", filesResponse)
        setFiles([])
      }

      // Process folders
      if (foldersResponse.success && foldersResponse.data) {
        const foldersData = foldersResponse.data.folders || []
        const processedFolders = foldersData.map((folder: any) => ({
          ...folder,
          sharedWithMe: true,
          // Ensure all required properties are present
          accessLevel: folder.accessLevel || "department",
          fileCount: folder.fileCount || 0,
          isDefault: folder.isDefault || false,
          createdBy: {
            _id: folder.createdBy?._id || "",
            firstName: folder.createdBy?.firstName || "Unknown",
            lastName: folder.createdBy?.lastName || "User",
            email: folder.createdBy?.email || "",
          },
          departments: folder.departments || [],
        }))
        setFolders(processedFolders)
        console.log("Processed folders:", processedFolders.length)
      } else {
        console.warn("No folders data received:", foldersResponse)
        setFolders([])
      }
    } catch (error) {
      console.error("Error fetching inbox data:", error)
      toast({
        title: "Error",
        description: "Failed to load inbox data",
        variant: "destructive",
      })
      // Set empty arrays on error
      setFiles([])
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch folder contents
  const fetchFolderContents = async (folderId: string) => {
    try {
      setLoading(true)
      const response = await api.getFolder(folderId, authContext)
      if (response.success && response.data) {
        setFolderFiles(response.data.folder.files || [])
      }
    } catch (error) {
      console.error("Error fetching folder contents:", error)
      toast({
        title: "Error",
        description: "Failed to load folder contents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchInboxData()
  }, [authContext])

  // Search and sort items
  useEffect(() => {
    // Use folder files if viewing a specific folder, otherwise use all items
    const itemsToFilter = currentFolder ? folderFiles : [...files, ...folders]

    console.log("Items to filter:", {
      currentFolder: currentFolder?.name,
      filesCount: files.length,
      foldersCount: folders.length,
      folderFilesCount: folderFiles.length,
      totalItems: itemsToFilter.length,
    })

    const filtered = itemsToFilter.filter((item) => {
      const name = "name" in item ? item.name : item.title || ""
      const description = item.description || ""
      const createdBy = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : ""

      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    // Sort items (folders first when not in a specific folder)
    filtered.sort((a, b) => {
      // Show folders first only when not viewing a specific folder
      if (!currentFolder) {
        const aIsFolder = !("file" in a)
        const bIsFolder = !("file" in b)
        if (aIsFolder && !bIsFolder) return -1
        if (!aIsFolder && bIsFolder) return 1
      }

      let aValue: any, bValue: any

      switch (sortBy) {
        case "name":
          aValue = ("name" in a ? a.name : a.title || "").toLowerCase()
          bValue = ("name" in b ? b.name : b.title || "").toLowerCase()
          break
        case "date":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case "size":
          aValue = "file" in a ? a.file.size : 0
          bValue = "file" in b ? b.file.size : 0
          break
        case "type":
          aValue = "file" in a ? a.file.type.toLowerCase() : "folder"
          bValue = "file" in b ? b.file.type.toLowerCase() : "folder"
          break
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          aValue = "priority" in a ? priorityOrder[a.priority as keyof typeof priorityOrder] || 0 : 0
          bValue = "priority" in b ? priorityOrder[b.priority as keyof typeof priorityOrder] || 0 : 0
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

    console.log("Filtered items:", filtered.length)
    setFilteredItems(filtered)
  }, [files, folders, folderFiles, currentFolder, searchTerm, sortBy, sortDirection])

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

  // Navigation to folder
  const navigateToFolder = async (folder: FolderData) => {
    console.log("Navigating to folder:", folder.name, folder._id)
    setCurrentFolder(folder)
    await fetchFolderContents(folder._id)
  }

  // Go back to inbox root
  const goBackToInbox = () => {
    console.log("Going back to inbox")
    setCurrentFolder(null)
    setFolderFiles([])
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

  const openViewModal = (item: FileData | FolderData) => {
    if ("file" in item) {
      setSelectedFile(item)
      setSelectedFolder(null)
      setShowViewModal(true)
    } else {
      setSelectedFolder(item)
      setSelectedFile(null)
      setShowFolderViewModal(true)
    }
  }

  const openDeleteDialog = (item: FileData | FolderData) => {
    if ("file" in item) {
      setSelectedFile(item)
      setSelectedFolder(null)
    } else {
      setSelectedFolder(item)
      setSelectedFile(null)
    }
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
        <span className="ml-2 text-gray-600">Loading inbox...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {currentFolder && (
              <Button variant="ghost" size="sm" onClick={goBackToInbox} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Inbox
              </Button>
            )}
            <h1 className="text-3xl font-bold text-slate-800">{currentFolder ? currentFolder.name : "Shared Inbox"}</h1>
          </div>
          <p className="text-slate-600 mt-1">
            {currentFolder
              ? `Files in ${currentFolder.name} folder`
              : "Files and folders shared with you and your department"}
          </p>
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
            onClick={currentFolder ? () => fetchFolderContents(currentFolder._id) : fetchInboxData}
            disabled={loading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {process.env.NODE_ENV === "development" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("Debug info:", {
                  files: files.length,
                  folders: folders.length,
                  filteredItems: filteredItems.length,
                  currentFolder: currentFolder?.name,
                  authContext: authContext.user?.role,
                })
              }}
              className="flex items-center gap-2 bg-transparent"
            >
              Debug
            </Button>
          )}
          <Badge variant="outline" className={`text-${themeColors.text} border-${themeColors.text}`}>
            {filteredItems.length} Items
          </Badge>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={currentFolder ? "Search folder contents..." : "Search shared items..."}
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

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              {searchTerm ? "No items found" : currentFolder ? "No files in this folder" : "No shared items"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : currentFolder
                  ? "This folder doesn't contain any files yet"
                  : "No files or folders have been shared with you yet"}
            </p>
            {/* Debug info in development */}
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-gray-400 mt-4">
                <p>
                  Debug: Files: {files.length}, Folders: {folders.length}
                </p>
                <p>Current folder: {currentFolder?.name || "None"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredItems.map((item) => {
                const isFolder = !("file" in item)
                const folder = isFolder ? (item as FolderData) : null
                const file = !isFolder ? (item as FileData) : null

                return (
                  <Card
                    key={item._id}
                    className="hover:shadow-md transition-all cursor-pointer group relative"
                    onClick={() => {
                      if (isFolder && !currentFolder) {
                        navigateToFolder(folder!)
                      } else {
                        openViewModal(item)
                      }
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="mb-3 flex justify-center">
                        {isFolder
                          ? getFolderIcon(folder!.accessLevel, folder!.isDefault)
                          : getFileIcon(file!.file.type, file!.file.name)}
                      </div>
                      <h3 className="font-medium text-sm truncate mb-1" title={isFolder ? folder!.name : file!.name}>
                        {isFolder ? folder!.name : file!.name}
                      </h3>
                      <p className="text-xs text-slate-500 mb-2">
                        {isFolder ? `${folder!.fileCount} files` : formatFileSize(file!.file.size)}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>

                      {/* Action Menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white shadow-sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => openViewModal(item)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {isFolder && !currentFolder ? (
                              <DropdownMenuItem onClick={() => navigateToFolder(folder!)}>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Open Folder
                              </DropdownMenuItem>
                            ) : (
                              !isFolder && (
                                <DropdownMenuItem asChild>
                                  <a href={file!.file.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </a>
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Status Indicators */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
                          Shared
                        </Badge>
                        {!isFolder && file!.requiresSignature && (
                          <Badge
                            variant="secondary"
                            className={`text-xs px-1 py-0 ${
                              hasUserSigned(file!) ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            <PenTool className="w-2 h-2 mr-1" />
                            {hasUserSigned(file!) ? "Signed" : "Sign"}
                          </Badge>
                        )}
                        {isFolder && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {folder!.accessLevel === "public"
                              ? "Public"
                              : folder!.accessLevel === "private"
                                ? "Private"
                                : "Department"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredItems.map((item) => {
                    const isFolder = !("file" in item)
                    const folder = isFolder ? (item as FolderData) : null
                    const file = !isFolder ? (item as FileData) : null

                    return (
                      <div
                        key={item._id}
                        className="flex items-center p-4 hover:bg-slate-50 cursor-pointer group"
                        onClick={() => {
                          if (isFolder && !currentFolder) {
                            navigateToFolder(folder!)
                          } else {
                            openViewModal(item)
                          }
                        }}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="mr-3">
                            {isFolder
                              ? getFolderIcon(folder!.accessLevel, folder!.isDefault)
                              : getFileIcon(file!.file.type, file!.file.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{isFolder ? folder!.name : file!.name}</h3>
                              <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
                                Shared
                              </Badge>
                              {!isFolder && file!.requiresSignature && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs px-1 py-0 ${
                                    hasUserSigned(file!)
                                      ? "bg-green-100 text-green-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  <PenTool className="w-2 h-2 mr-1" />
                                  {hasUserSigned(file!) ? "Signed" : "Sign"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 truncate">{item.description}</p>
                          </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-6 text-sm text-slate-500">
                          <span className="w-20 text-right">
                            {isFolder ? `${folder!.fileCount} files` : formatFileSize(file!.file.size)}
                          </span>
                          <span className="w-24">{isFolder ? folder!.accessLevel : file!.category}</span>
                          <span className="w-32">
                            {item.createdBy.firstName} {item.createdBy.lastName}
                          </span>
                          <span className="w-24">{formatDate(item.createdAt)}</span>
                        </div>
                        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => openViewModal(item)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {isFolder && !currentFolder ? (
                                <DropdownMenuItem onClick={() => navigateToFolder(folder!)}>
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  Open Folder
                                </DropdownMenuItem>
                              ) : (
                                !isFolder && (
                                  <DropdownMenuItem asChild>
                                    <a href={file!.file.url} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </a>
                                  </DropdownMenuItem>
                                )
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
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
                  <p className="text-sm font-medium">{selectedFile.file.name}</p>
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
              {selectedFile.folder && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Folder</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Folder className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">{selectedFile.folder.name}</span>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Departments</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedFile.departments.map((dept) => (
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Folder Modal */}
      <Dialog open={showFolderViewModal} onOpenChange={setShowFolderViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFolder && getFolderIcon(selectedFolder.accessLevel, selectedFolder.isDefault)}
              {selectedFolder?.name}
            </DialogTitle>
            <DialogDescription>Shared folder details and information</DialogDescription>
          </DialogHeader>
          {selectedFolder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Folder Name</Label>
                  <p className="text-sm font-medium">{selectedFolder.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Count</Label>
                  <p className="text-sm font-medium">{selectedFolder.fileCount} files</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedFolder.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Access Level</Label>
                  <div className="flex items-center gap-2">
                    {selectedFolder.accessLevel === "public" && <Globe className="w-4 h-4 text-green-600" />}
                    {selectedFolder.accessLevel === "private" && <Lock className="w-4 h-4 text-red-600" />}
                    {selectedFolder.accessLevel === "department" && <Users className="w-4 h-4 text-orange-600" />}
                    <span className="text-sm capitalize">{selectedFolder.accessLevel}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                  <p className="text-sm">{new Date(selectedFolder.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                <p className="text-sm">
                  {selectedFolder.createdBy.firstName} {selectedFolder.createdBy.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{selectedFolder.createdBy.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Departments</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedFolder.departments.map((dept) => (
                    <Badge key={dept._id} variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {dept.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setShowFolderViewModal(false)
                    navigateToFolder(selectedFolder)
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Open Folder
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
            <AlertDialogTitle>Delete {selectedFile ? "File" : "Folder"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFile ? selectedFile.name : selectedFolder?.name}"? This action
              cannot be undone.
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
                `Delete ${selectedFile ? "File" : "Folder"}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
