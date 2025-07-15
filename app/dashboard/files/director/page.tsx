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
  Folder,
  FileText,
  Eye,
  Download,
  Search,
  MoreHorizontal,
  Grid3X3,
  List,
  RefreshCw,
  SortAsc,
  SortDesc,
  ImageIcon,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive,
  ChevronRight,
  Clock,
  ChevronLeft,
  ExternalLink,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface FileData {
  _id: string
  id?: string
  name: string
  title: string
  description: string
  category: string
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
  createdAt: string
  updatedAt: string
}

interface FolderData {
  _id: string
  id?: string
  name: string
  description: string
  createdBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
  files?: FileData[]
}

type SortOption = "name" | "date" | "size" | "type"
type SortDirection = "asc" | "desc"
type ViewType = "all" | "files" | "folders"

const ITEMS_PER_PAGE = 30

export default function DirectorFilesPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const router = useRouter()

  // Core state
  const [folders, setFolders] = useState<FolderData[]>([])
  const [files, setFiles] = useState<FileData[]>([])
  const [filteredItems, setFilteredItems] = useState<(FileData | FolderData)[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [viewType, setViewType] = useState<ViewType>("all")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedItems, setPaginatedItems] = useState<(FileData | FolderData)[]>([])

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FileData | FolderData | null>(null)

  // Theme colors for director
  const themeColors = {
    primary: "bg-gradient-to-r from-red-500 to-red-600",
    primaryHover: "bg-gradient-to-r from-red-600 to-red-700",
    bg: "bg-red-50",
    text: "text-red-600",
    badge: "bg-red-100",
    badgeText: "text-red-800",
    border: "border-red-200",
    accent: "bg-red-500",
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

  // Fetch director files and folders
  const fetchDirectorFiles = async () => {
    try {
      setLoading(true)
      
      // Fetch files
      const filesResponse = await api.getFilesForDirector(authContext)
      if (filesResponse.success && filesResponse.data) {
        const processedFiles = filesResponse.data
          .filter((file: any) => file) // Filter out null/undefined
          .map((file: any) => ({
            ...file,
            id: file.id || file._id,
            name: file.name || file.title || "Untitled",
            title: file.title || file.name || "Untitled",
            description: file.description || "No description",
            category: file.category || "Uncategorized",
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
          }))
        setFiles(processedFiles)
      } else {
        setFiles([])
      }

      // Fetch folders
    //   const foldersResponse = await api.get('/api/structure/director/folders', undefined, authContext)
    //   if (foldersResponse.success && foldersResponse.data) {
    //     const processedFolders = foldersResponse.data
    //       .filter((folder: any) => folder) // Filter out null/undefined
    //       .map((folder: any) => ({
    //         ...folder,
    //         id: folder.id || folder._id,
    //         name: folder.name || "Untitled Folder",
    //         description: folder.description || "No description",
    //         createdBy: {
    //           _id: folder.createdBy?._id || "",
    //           firstName: folder.createdBy?.firstName || "Unknown",
    //           lastName: folder.createdBy?.lastName || "User",
    //           email: folder.createdBy?.email || "",
    //         },
    //       }))
    //     setFolders(processedFolders)
    //   } else {
    //     setFolders([])
    //   }

    } catch (error) {
      console.error("Error fetching director files:", error)
      toast({
        title: "Error",
        description: "Failed to load director files",
        variant: "destructive",
      })
      setFiles([])
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authContext.isAuthenticated && authContext.user?.role === 'director') {
      fetchDirectorFiles()
    }
  }, [authContext])

  // Search, sort, and paginate items
  useEffect(() => {
    let items: (FileData | FolderData)[] = []

    // Combine files and folders based on view type
    if (viewType === "all") {
      items = [...folders, ...files]
    } else if (viewType === "files") {
      items = [...files]
    } else if (viewType === "folders") {
      items = [...folders]
    }

    // Filter items
    const filtered = items.filter((item) => {
      if (!item) return false // Skip null/undefined items
      
      const name = item.name || ""
      const description = item.description || ""
      const createdBy = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : ""

      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    // Sort items
    filtered.sort((a, b) => {
      if (!a || !b) return 0 // Skip null/undefined items
      
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
          // For folders, we might want to sort by number of files or some other metric
          aValue = a && 'file' in a ? a.file.size : 0
          bValue = b && 'file' in b ? b.file.size : 0
          break
        case "type":
          aValue = a && 'file' in a ? a.file.type.toLowerCase() : 'folder'
          bValue = b && 'file' in b ? b.file.type.toLowerCase() : 'folder'
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

    setPaginatedItems(paginatedResult)
  }, [folders, files, searchTerm, sortBy, sortDirection, currentPage, viewType])

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
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleDownload = async (file: FileData) => {
    try {
      const link = document.createElement("a")
      link.href = file.file.url
      link.download = file.file.name
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      document.body.appendChild(link)
      link.click()
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

  const navigateToFolder = (folderId: string) => {
    router.push(`/director/files/folder/${folderId}`)
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Director Files</h1>
              <p className="text-gray-600">View all files and folders under your directorship</p>
              <Badge className={`mt-2 ${themeColors.badge} ${themeColors.badgeText}`}>
                DIRECTOR FILES VIEW
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDirectorFiles}
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

        {/* Search and Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200"
              />
            </div>

            <div className="flex items-center space-x-3">
              {/* View Type Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <Button
                  variant={viewType === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("all")}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                    viewType === "all" ? themeColors.primary : "hover:bg-gray-200"
                  }`}
                >
                  All
                </Button>
                <Button
                  variant={viewType === "folders" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("folders")}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                    viewType === "folders" ? themeColors.primary : "hover:bg-gray-200"
                  }`}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Folders
                </Button>
                <Button
                  variant={viewType === "files" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("files")}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                    viewType === "files" ? themeColors.primary : "hover:bg-gray-200"
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Files
                </Button>
              </div>

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
                  <DropdownMenuItem onClick={() => toggleSort("size")}>
                    Size {sortBy === "size" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("type")}>
                    Type {sortBy === "type" && (sortDirection === "asc" ? "↑" : "↓")}
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
                <Folder className={`w-10 h-10 ${themeColors.text}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? "No items found" : "No files or folders yet"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "There are currently no files or folders available"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {paginatedItems.map((item) => {
                  if (!item) return null // Skip null/undefined items
                  
                  return (
                    <Card
                      key={item.id || item._id}
                      className="group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md bg-white rounded-2xl overflow-hidden"
                      onClick={() => item && 'file' in item ? openViewModal(item) : navigateToFolder(item._id)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="mb-4 flex justify-center">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                            {item && 'file' in item ? (
                              getFileIcon(item.file.type, item.file.name)
                            ) : (
                              <Folder className="w-8 h-8 text-yellow-500" />
                            )}
                          </div>
                        </div>

                        <h3
                          className="font-semibold text-sm text-gray-900 truncate mb-2 group-hover:text-blue-600 transition-colors duration-200"
                          title={item.name}
                        >
                          {item.name}
                        </h3>

                        {item && 'file' in item ? (
                          <p className="text-xs text-gray-500 mb-3">
                            {formatFileSize(item.file.size)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mb-3">
                            Folder
                          </p>
                        )}

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
                              {item && 'file' in item ? (
                                <>
                                  <DropdownMenuItem onClick={() => openViewModal(item)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload(item)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a href={item.file.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Open in New Tab
                                    </a>
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => navigateToFolder(item._id)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Open Folder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Users className="w-4 h-4 mr-2" />
                                    Share Folder
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                    if (!item) return null // Skip null/undefined items
                    
                    return (
                      <div
                        key={item.id || item._id}
                        className="flex items-center p-6 hover:bg-gray-50 cursor-pointer group transition-all duration-200"
                        onClick={() => item && 'file' in item ? openViewModal(item) : navigateToFolder(item._id)}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="mr-4 p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                            {item && 'file' in item ? (
                              getFileIcon(item.file.type, item.file.name)
                            ) : (
                              <Folder className="w-8 h-8 text-yellow-500" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                                {item.name}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-1 rounded-lg"
                              >
                                {item && 'file' in item ? item.file.type.split('/')[0] : 'Folder'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{item.description}</p>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-6 text-sm text-gray-500">
                          {item && 'file' in item ? (
                            <span className="w-24 text-right font-medium">
                              {formatFileSize(item.file.size)}
                            </span>
                          ) : (
                            <span className="w-24 text-right font-medium">
                              -
                            </span>
                          )}
                          <span className="w-28 truncate">
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
                              {item && 'file' in item ? (
                                <>
                                  <DropdownMenuItem onClick={() => openViewModal(item)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload(item)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a href={item.file.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Open in New Tab
                                    </a>
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => navigateToFolder(item._id)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Open Folder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Users className="w-4 h-4 mr-2" />
                                    Share Folder
                                  </DropdownMenuItem>
                                </>
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

        {/* View Item Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                {selectedItem && (
                  <div className="p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                    {selectedItem && 'file' in selectedItem ? (
                      getFileIcon(selectedItem.file.type, selectedItem.file.name)
                    ) : (
                      <Folder className="w-8 h-8 text-yellow-500" />
                    )}
                  </div>
                )}
                {selectedItem?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedItem && 'file' in selectedItem ? 'File details' : 'Folder details'}
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6">
                {selectedItem && 'file' in selectedItem ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600">File Name</Label>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{selectedItem.file.name}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600">File Size</Label>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {formatFileSize(selectedItem.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedItem.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600">Category</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedItem.category}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600">File Type</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedItem.file.type}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600">Created By</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedItem.createdBy.firstName} {selectedItem.createdBy.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{selectedItem.createdBy.email}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(selectedItem.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(selectedItem)}
                        className="flex-1 h-12 rounded-xl bg-transparent"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                      <Button variant="outline" asChild className="flex-1 h-12 rounded-xl bg-transparent">
                        <a href={selectedItem.file.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in New Tab
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <Label className="text-sm font-medium text-gray-600">Folder Description</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedItem.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600">Created By</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedItem.createdBy.firstName} {selectedItem.createdBy.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{selectedItem.createdBy.email}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(selectedItem.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => navigateToFolder(selectedItem._id)}
                        className={`flex-1 h-12 rounded-xl ${themeColors.primary} hover:${themeColors.primaryHover}`}
                      >
                        <Folder className="w-4 h-4 mr-2" />
                        Open Folder
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}