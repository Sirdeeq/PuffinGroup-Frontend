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
  Share,
  ChevronRight,
  Clock,
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

type SortOption = "name" | "date" | "size" | "type" | "priority"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE = 30

export default function SharedFilesPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const router = useRouter()

  // Core state
  const [files, setFiles] = useState<FileData[]>([])
  const [filteredItems, setFilteredItems] = useState<FileData[]>([])

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
  const [paginatedItems, setPaginatedItems] = useState<FileData[]>([])

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)

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

  // Fetch shared files
  const fetchSharedFiles = async () => {
    try {
      setLoading(true)
      console.log("Fetching shared files...")

      const filesResponse = await api.getSharedFiles(authContext)
      console.log("Files response:", filesResponse)

      // Process shared files
      if (filesResponse.success && filesResponse.data) {
        const filesData = filesResponse.data || []
        const processedFiles = filesData.map((file: any) => ({
          ...file,
          id: file.id || file._id,
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
          departments: file.departments || [],
          signatures: file.signatures || [],
          sharedWithMe: true,
        }))
        console.log("Processed shared files:", processedFiles.length)
        setFiles(processedFiles)
      } else {
        console.warn("No shared files data received:", filesResponse)
        setFiles([])
        toast({
          title: "No shared files",
          description: "You don't have any shared files yet",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error fetching shared files:", error)
      toast({
        title: "Error",
        description: "Failed to load shared files",
        variant: "destructive",
      })
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authContext.isAuthenticated) {
      fetchSharedFiles()
    }
  }, [authContext])

  // Search, sort, and paginate items
  useEffect(() => {
    console.log("Filtering files. Available files:", files.length)

    const filtered = files.filter((file) => {
      const name = file.name || ""
      const description = file.description || ""
      const createdBy = file.createdBy ? `${file.createdBy.firstName} ${file.createdBy.lastName}` : ""

      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    // Sort files
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "date":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case "size":
          aValue = a.file.size
          bValue = b.file.size
          break
        case "type":
          aValue = a.file.type.toLowerCase()
          bValue = b.file.type.toLowerCase()
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

    console.log("Filtered files:", filtered.length)
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

    console.log("Paginated files:", paginatedResult.length)
    setPaginatedItems(paginatedResult)
  }, [files, searchTerm, sortBy, sortDirection, currentPage])

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
  const openViewModal = (file: FileData) => {
    setSelectedFile(file)
    setShowViewModal(true)
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
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared Files</h1>
              <p className="text-gray-600">Files that have been shared with you</p>
              {authContext.user?.role && (
                <Badge className={`mt-2 ${themeColors.badge} ${themeColors.badgeText}`}>
                  {authContext.user.role.toUpperCase()} SHARED FILES
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSharedFiles}
                disabled={loading}
                className="flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Badge variant="outline" className={`${themeColors.border} ${themeColors.text} px-3 py-1`}>
                {filteredItems.length} Files
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search shared files..."
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

        {/* Files Display */}
        {paginatedItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-16 text-center">
              <div className={`w-20 h-20 rounded-full ${themeColors.bg} flex items-center justify-center mx-auto mb-6`}>
                <Inbox className={`w-10 h-10 ${themeColors.text}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? "No files found" : "No shared files yet"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No files have been shared with you yet"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {paginatedItems.map((file) => (
                  <Card
                    key={file.id || file._id}
                    className="group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md bg-white rounded-2xl overflow-hidden"
                    onClick={() => openViewModal(file)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                          {getFileIcon(file.file.type, file.file.name)}
                        </div>
                      </div>

                      <h3
                        className="font-semibold text-sm text-gray-900 truncate mb-2 group-hover:text-blue-600 transition-colors duration-200"
                        title={file.name}
                      >
                        {file.name}
                      </h3>

                      <p className="text-xs text-gray-500 mb-3">
                        {formatFileSize(file.file.size)}
                      </p>

                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(file.createdAt)}
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
                            <DropdownMenuItem onClick={() => openViewModal(file)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open in New Tab
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Status Indicators */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-lg">
                          <Share className="w-2 h-2 mr-1" />
                          Shared
                        </Badge>
                        {file.requiresSignature && (
                          <Badge
                            variant="secondary"
                            className={`text-xs px-2 py-1 rounded-lg ${
                              hasUserSigned(file) ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {paginatedItems.map((file) => (
                    <div
                      key={file.id || file._id}
                      className="flex items-center p-6 hover:bg-gray-50 cursor-pointer group transition-all duration-200"
                      onClick={() => openViewModal(file)}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="mr-4 p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                          {getFileIcon(file.file.type, file.file.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                              {file.name}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-lg"
                            >
                              <Share className="w-2 h-2 mr-1" />
                              Shared
                            </Badge>
                            {file.requiresSignature && (
                              <Badge
                                variant="secondary"
                                className={`text-xs px-2 py-1 rounded-lg ${
                                  hasUserSigned(file)
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                <PenTool className="w-2 h-2 mr-1" />
                                {hasUserSigned(file) ? "Signed" : "Sign"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{file.description}</p>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center space-x-6 text-sm text-gray-500">
                        <span className="w-24 text-right font-medium">
                          {formatFileSize(file.file.size)}
                        </span>
                        <span className="w-28 truncate">{file.category}</span>
                        <span className="w-36 truncate">
                          {file.createdBy ? `${file.createdBy.firstName} ${file.createdBy.lastName}` : "System"}
                        </span>
                        <span className="w-28 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(file.createdAt)}
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
                            <DropdownMenuItem onClick={() => openViewModal(file)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open in New Tab
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length} files
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
      </div>
    </div>
  )
}