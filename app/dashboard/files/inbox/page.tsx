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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Inbox,
  FileText,
  Eye,
  Download,
  PenTool,
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
  ChevronRight,
  Clock,
  Share,
  ChevronLeft,
  ExternalLink,
} from "lucide-react"
import { redirect, useRouter } from "next/navigation"

interface FileData {
  _id: string
  id?: string
  name: string
  title: string
  description: string
  category: string
  priority?: string
  status: string
  requiresSignature?: boolean
  folder?: {
    _id: string
    id?: string
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
  id?: string
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

interface BreadcrumbItem {
  _id: string
  id?: string
  name: string
  isPublic: boolean
  isDefault: boolean
}

type SortOption = "name" | "date" | "size" | "type" | "priority"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE = 30

export default function InboxPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const router = useRouter()

  // Core state
  const [files, setFiles] = useState<FileData[]>([])
  const [folders, setFolders] = useState<FolderData[]>([])
  const [filteredItems, setFilteredItems] = useState<(FileData | FolderData)[]>([])
  const [currentFolder, setCurrentFolder] = useState<FolderData | null>(null)
  const [folderFiles, setFolderFiles] = useState<FileData[]>([])
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedItems, setPaginatedItems] = useState<(FileData | FolderData)[]>([])

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFolderViewModal, setShowFolderViewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Selected items for modals
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null)

  // Get theme colors based on user role
  const getThemeColor = () => {
    switch (authContext.user?.role) {
      case "admin":
        return {
          primary: "bg-gradient-to-r from-orange-500 to-orange-600",
          primaryHover: "bg-gradient-to-r from-orange-600 to-orange-700",
          bg: "bg-orange-50",
          text: "text-orange-600",
          badge: "bg-orange-100",
          badgeText: "text-orange-800",
          border: "border-orange-200",
          accent: "bg-orange-500",
        }
      case "director":
        return {
          primary: "bg-gradient-to-r from-red-500 to-red-600",
          primaryHover: "bg-gradient-to-r from-red-600 to-red-700",
          bg: "bg-red-50",
          text: "text-red-600",
          badge: "bg-red-100",
          badgeText: "text-red-800",
          border: "border-red-200",
          accent: "bg-red-500",
        }
      case "department":
        return {
          primary: "bg-gradient-to-r from-green-500 to-green-600",
          primaryHover: "bg-gradient-to-r from-green-600 to-green-700",
          bg: "bg-green-50",
          text: "text-green-600",
          badge: "bg-green-100",
          badgeText: "text-green-800",
          border: "border-green-200",
          accent: "bg-green-500",
        }
      default:
        return {
          primary: "bg-gradient-to-r from-blue-500 to-blue-600",
          primaryHover: "bg-gradient-to-r from-blue-600 to-blue-700",
          bg: "bg-blue-50",
          text: "text-blue-600",
          badge: "bg-blue-100",
          badgeText: "text-blue-800",
          border: "border-blue-200",
          accent: "bg-blue-500",
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

  // Fetch shared inbox files and folders
  const fetchInboxData = async () => {
    try {
      setLoading(true)
      console.log("Fetching shared inbox data...")

      // Fetch both shared files and folders in parallel
      const [filesResponse, foldersResponse] = await Promise.all([
        api.getInboxFiles(authContext),
        api.getInboxFolders(authContext),
      ])

      console.log("Files response:", filesResponse)
      console.log("Folders response:", foldersResponse)

      // Process shared files
      if (filesResponse.success && filesResponse.data) {
        const filesData = filesResponse.data.files || []
        const processedFiles = filesData.map((file: any) => ({
          ...file,
          id: file.id || file._id, // Ensure both id and _id are available
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
        console.log("Processed shared files:", processedFiles.length)
        setFiles(processedFiles)
      } else {
        console.warn("No shared files data received:", filesResponse)
        setFiles([])
      }

      // Process shared folders
      if (foldersResponse.success && foldersResponse.data) {
        const foldersData = foldersResponse.data.folders || []
        const processedFolders = foldersData.map((folder: any) => ({
          ...folder,
          id: folder.id || folder._id, // Ensure both id and _id are available
          sharedWithMe: true,
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
        console.log("Processed shared folders:", processedFolders.length)
        setFolders(processedFolders)
      } else {
        console.warn("No shared folders data received:", foldersResponse)
        setFolders([])
      }
    } catch (error) {
      console.error("Error fetching shared inbox data:", error)
      toast({
        title: "Error",
        description: "Failed to load shared inbox data",
        variant: "destructive",
      })
      setFiles([])
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch folder contents when opening a shared folder
  const fetchFolderContents = async (folderId: string) => {
    try {
      setLoading(true)
      console.log("Fetching folder contents for:", folderId)

      const response = await api.getFolder(folderId, authContext)
      console.log("Folder contents response:", response)

      if (response.success && response.data) {
        const folderData = response.data.folder
        const folderFiles = folderData.files || []

        // Process files in the folder
        const processedFiles = folderFiles.map((file: any) => ({
          ...file,
          id: file.id || file._id,
          name: file.name || file.title || "Untitled",
          title: file.title || file.name || "Untitled",
          description: file.description || "No description",
          category: file.category || "Uncategorized",
          status: file.status || "active",
          priority: file.priority || "medium",
          sharedWithMe: true,
        }))

        setFolderFiles(processedFiles)

        // Fetch breadcrumb for navigation
        await fetchBreadcrumb(folderId)
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

  // Fetch breadcrumb path
  const fetchBreadcrumb = async (folderId: string) => {
    try {
      const response = await api.getFolderBreadcrumb(folderId, authContext)
      if (response.success && response.data) {
        const breadcrumbData = response.data.breadcrumb || []
        setBreadcrumb(
          breadcrumbData.map((item: any) => ({
            ...item,
            id: item.id || item._id,
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching breadcrumb:", error)
    }
  }

  useEffect(() => {
    if (authContext.isAuthenticated) {
      fetchInboxData()
    }
  }, [authContext])

  // Search, sort, and paginate items
  useEffect(() => {
    console.log("Filtering items. Current folder:", currentFolder?.name)
    console.log("Available files:", files.length)
    console.log("Available folders:", folders.length)
    console.log("Folder files:", folderFiles.length)

    // Use folder files if viewing a specific folder, otherwise use all shared items
    const itemsToFilter = currentFolder ? folderFiles : [...files, ...folders]

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

    // Calculate pagination
    const totalItems = filtered.length
    const pages = Math.ceil(totalItems / ITEMS_PER_PAGE)
    setTotalPages(pages)

    // Reset to first page if current page is out of bounds
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1)
    }

    // Get items for current page
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedResult = filtered.slice(startIndex, endIndex)

    console.log("Paginated items:", paginatedResult.length)
    setPaginatedItems(paginatedResult)
  }, [files, folders, folderFiles, currentFolder, searchTerm, sortBy, sortDirection, currentPage])

  // Navigation functions
  const navigateToFolder = async (folder: FolderData) => {
    console.log("Navigating to shared folder:", folder.name, folder.id || folder._id)
    setCurrentFolder(folder)
    setCurrentPage(1)
    await fetchFolderContents(folder.id || folder._id)
  }

  const navigateBack = () => {
    console.log("Going back to shared inbox")
    setCurrentFolder(null)
    setFolderFiles([])
    setBreadcrumb([])
    setCurrentPage(1)
  }

  const navigateToBreadcrumb = async (item: BreadcrumbItem, index: number) => {
    if (index === 0) {
      navigateBack()
    } else {
      const folder = folders.find((f) => (f.id || f._id) === (item.id || item._id))
      if (folder) {
        await navigateToFolder(folder)
      }
    }
  }

  // Utility functions
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

  // Modal handlers
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

  const handleDownload = async (file: FileData) => {
    try {
      // Create a temporary link to download the file
      const link = document.createElement("a")
      link.href = file.file.url
      link.download = file.file.name
      link.target = "_blank"
      link.rel = "noopener noreferrer"

      // Add the link to the document and click it
      document.body.appendChild(link)
      link.click()

      // Remove the link from the document
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: `Downloading ${file.file.name}`,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  // Check if user has already signed the file
  const hasUserSigned = (file: FileData) => {
    return file.signatures?.some((sig) => sig.user === authContext.user?.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className={`w-12 h-12 rounded-full ${themeColors.accent} animate-pulse mx-auto`} />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-24 mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="space-y-8 p-8">
        {/* Enhanced Header with Breadcrumb */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Enhanced Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-sm">
                <Inbox className="w-4 h-4 text-gray-500" />
                <button
                  onClick={navigateBack}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1 text-gray-600 hover:bg-blue-50 px-2 py-1 rounded-lg"
                >
                  Shared Inbox
                </button>
                {breadcrumb.map((item, index) => (
                  <div key={item.id || item._id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => navigateToBreadcrumb(item, index)}
                      className={`hover:text-blue-600 transition-colors px-2 py-1 rounded-lg ${
                        index === breadcrumb.length - 1
                          ? `font-medium ${themeColors.text} bg-blue-50`
                          : "text-gray-600 hover:bg-blue-50"
                      }`}
                    >
                      {item.name}
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentFolder ? currentFolder.name : "Shared Inbox"}
                </h1>
                <p className="text-gray-600">
                  {currentFolder
                    ? `Files in ${currentFolder.name} folder`
                    : "Files and folders shared with you and your department"}
                </p>
                {authContext.user?.role && (
                  <Badge className={`mt-2 ${themeColors.badge} ${themeColors.badgeText}`}>
                    {authContext.user.role.toUpperCase()} INBOX
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={
                  currentFolder ? () => fetchFolderContents(currentFolder.id || currentFolder._id) : fetchInboxData
                }
                disabled={loading}
                className="flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Badge variant="outline" className={`${themeColors.border} ${themeColors.text} px-3 py-1`}>
                {filteredItems.length} Items
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={currentFolder ? "Search folder contents..." : "Search shared items..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200"
              />
            </div>

            <div className="flex items-center space-x-3">
              {/* Sort Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 px-4 rounded-xl hover:bg-gray-50 bg-transparent">
                    {sortDirection === "asc" ? (
                      <SortAsc className="w-4 h-4 mr-2" />
                    ) : (
                      <SortDesc className="w-4 h-4 mr-2" />
                    )}
                    Sort by {sortBy}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                    viewMode === "grid" ? themeColors.primary : "hover:bg-gray-200"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                    viewMode === "list" ? themeColors.primary : "hover:bg-gray-200"
                  }`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Items Display */}
        {paginatedItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-16 text-center">
              <div className={`w-20 h-20 rounded-full ${themeColors.bg} flex items-center justify-center mx-auto mb-6`}>
                <Inbox className={`w-10 h-10 ${themeColors.text}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? "No items found" : currentFolder ? "Folder is empty" : "No shared items yet"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms or browse through folders"
                  : currentFolder
                    ? "This shared folder doesn't contain any files yet"
                    : "No files or folders have been shared with you yet"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {paginatedItems.map((item) => {
                  const isFolder = !("file" in item)
                  const folder = isFolder ? (item as FolderData) : null
                  const file = !isFolder ? (item as FileData) : null

                  return (
                    <Card
                      key={item.id || item._id}
                      className="group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md bg-white rounded-2xl overflow-hidden"
                      onClick={() => {
                        if (isFolder && !currentFolder) {
                          navigateToFolder(folder!)
                        } else {
                          openViewModal(item)
                        }
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="mb-4 flex justify-center">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                            {isFolder
                              ? getFolderIcon(folder!.accessLevel, folder!.isDefault)
                              : getFileIcon(file!.file.type, file!.file.name)}
                          </div>
                        </div>

                        <h3
                          className="font-semibold text-sm text-gray-900 truncate mb-2 group-hover:text-blue-600 transition-colors duration-200"
                          title={isFolder ? folder!.name : file!.name}
                        >
                          {isFolder ? folder!.name : file!.name}
                        </h3>

                        <p className="text-xs text-gray-500 mb-3">
                          {isFolder ? `${folder!.fileCount} files` : formatFileSize(file!.file.size)}
                        </p>

                        <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.createdAt)}
                        </div>

                        {/* Action Menu */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white rounded-xl"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
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
                                  <DropdownMenuItem onClick={() => handleDownload(file!)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                )
                              )}
                              {!isFolder && (
                                <DropdownMenuItem asChild>
                                  <a href={file!.file.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open in New Tab
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Status Indicators */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-lg">
                            <Share className="w-2 h-2 mr-1" />
                            Shared
                          </Badge>
                          {!isFolder && file!.requiresSignature && (
                            <Badge
                              variant="secondary"
                              className={`text-xs px-2 py-1 rounded-lg ${
                                hasUserSigned(file!) ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              <PenTool className="w-2 h-2 mr-1" />
                              {hasUserSigned(file!) ? "Signed" : "Sign"}
                            </Badge>
                          )}
                          {isFolder && (
                            <Badge
                              variant="secondary"
                              className={`text-xs px-2 py-1 rounded-lg ${
                                folder!.accessLevel === "public"
                                  ? "bg-green-100 text-green-700"
                                  : folder!.accessLevel === "private"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                              }`}
                            >
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {paginatedItems.map((item) => {
                    const isFolder = !("file" in item)
                    const folder = isFolder ? (item as FolderData) : null
                    const file = !isFolder ? (item as FileData) : null

                    return (
                      <div
                        key={item.id || item._id}
                        className="flex items-center p-6 hover:bg-gray-50 cursor-pointer group transition-all duration-200"
                        onClick={() => {
                          if (isFolder && !currentFolder) {
                            navigateToFolder(folder!)
                          } else {
                            openViewModal(item)
                          }
                        }}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="mr-4 p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                            {isFolder
                              ? getFolderIcon(folder!.accessLevel, folder!.isDefault)
                              : getFileIcon(file!.file.type, file!.file.name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                                {isFolder ? folder!.name : file!.name}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-lg"
                              >
                                <Share className="w-2 h-2 mr-1" />
                                Shared
                              </Badge>
                              {!isFolder && file!.requiresSignature && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs px-2 py-1 rounded-lg ${
                                    hasUserSigned(file!)
                                      ? "bg-green-100 text-green-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  <PenTool className="w-2 h-2 mr-1" />
                                  {hasUserSigned(file!) ? "Signed" : "Sign"}
                                </Badge>
                              )}
                              {isFolder && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs px-2 py-1 rounded-lg ${
                                    folder!.accessLevel === "public"
                                      ? "bg-green-100 text-green-700"
                                      : folder!.accessLevel === "private"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-orange-100 text-orange-700"
                                  }`}
                                >
                                  {folder!.accessLevel === "public"
                                    ? "Public"
                                    : folder!.accessLevel === "private"
                                      ? "Private"
                                      : "Department"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{item.description}</p>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-6 text-sm text-gray-500">
                          <span className="w-24 text-right font-medium">
                            {isFolder ? `${folder!.fileCount} files` : formatFileSize(file!.file.size)}
                          </span>
                          <span className="w-28 truncate">{isFolder ? folder!.accessLevel : file!.category}</span>
                          <span className="w-36 truncate">
                            {item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : "System"}
                          </span>
                          <span className="w-28 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-gray-200">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
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
                                  <DropdownMenuItem onClick={() => handleDownload(file!)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                )
                              )}
                              {!isFolder && (
                                <DropdownMenuItem asChild>
                                  <a href={file!.file.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open in New Tab
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-10 px-4 rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else {
                          const start = Math.max(1, currentPage - 2)
                          const end = Math.min(totalPages, start + 4)
                          pageNum = start + i
                          if (pageNum > end) return null
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-10 w-10 rounded-xl ${currentPage === pageNum ? themeColors.primary : ""}`}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-10 px-4 rounded-xl"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* View File Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                {selectedFile && (
                  <div className="p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                    {getFileIcon(selectedFile.file.type, selectedFile.file.name)}
                  </div>
                )}
                {selectedFile?.title}
              </DialogTitle>
              <DialogDescription>Shared file details and information</DialogDescription>
            </DialogHeader>
            {selectedFile && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">File Name</Label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedFile.file.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">File Size</Label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatFileSize(selectedFile.file.size)}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedFile.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Category</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedFile.category}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Priority</Label>
                    {selectedFile.priority ? (
                      <Badge className={getPriorityColor(selectedFile.priority)}>{selectedFile.priority}</Badge>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">Not specified</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Shared By</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedFile.createdBy.firstName} {selectedFile.createdBy.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{selectedFile.createdBy.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Shared Date</Label>
                    <p className="text-sm text-gray-900 mt-1">{new Date(selectedFile.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {selectedFile.folder && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Folder</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Folder className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-900">{selectedFile.folder.name}</span>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Departments</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedFile.departments.map((dept) => (
                      <Badge key={dept._id} variant="outline" className="text-xs rounded-lg">
                        <Building2 className="w-3 h-3 mr-1" />
                        {dept.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedFile)}
                    className="flex-1 h-12 rounded-xl bg-transparent"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                  <Button variant="outline" asChild className="flex-1 h-12 rounded-xl bg-transparent">
                    <a href={selectedFile.file.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Folder Modal */}
        <Dialog open={showFolderViewModal} onOpenChange={setShowFolderViewModal}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                {selectedFolder && (
                  <div className="p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                    {getFolderIcon(selectedFolder.accessLevel, selectedFolder.isDefault)}
                  </div>
                )}
                {selectedFolder?.name}
              </DialogTitle>
              <DialogDescription>Shared folder details and information</DialogDescription>
            </DialogHeader>
            {selectedFolder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Folder Name</Label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedFolder.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">File Count</Label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedFolder.fileCount} files</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedFolder.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Access Level</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedFolder.accessLevel === "public" && <Globe className="w-4 h-4 text-green-600" />}
                      {selectedFolder.accessLevel === "private" && <Lock className="w-4 h-4 text-red-600" />}
                      {selectedFolder.accessLevel === "department" && <Users className="w-4 h-4 text-orange-600" />}
                      <span className="text-sm text-gray-900 capitalize">{selectedFolder.accessLevel}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Shared Date</Label>
                    <p className="text-sm text-gray-900 mt-1">{new Date(selectedFolder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Shared By</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedFolder.createdBy.firstName} {selectedFolder.createdBy.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedFolder.createdBy.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Departments</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedFolder.departments.map((dept) => (
                      <Badge key={dept._id} variant="outline" className="text-xs rounded-lg">
                        <Building2 className="w-3 h-3 mr-1" />
                        {dept.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl bg-transparent"
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
      </div>
    </div>
  )
}
