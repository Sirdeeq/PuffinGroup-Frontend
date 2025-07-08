"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Loader2,
  Search,
  MoreHorizontal,
  Grid3X3,
  List,
  Building2,
  Share,
  Plus,
  RefreshCw,
  Folder,
  ImageIcon,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive,
  SortAsc,
  SortDesc,
  FolderPlus,
  Lock,
  Globe,
  Users,
  Home,
  ChevronRight,
  Move,
  Clock,
} from "lucide-react"
import { redirect } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import FileUploadForm from "@/components/file-upload-form"

interface FileData {
  _id: string
  name: string
  title: string
  description: string
  category: string
  priority?: string
  status: string
  requiresSignature?: boolean
  folder: {
    _id: string
    name: string
    description?: string
  } | null
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
}

type SortOption = "name" | "date" | "size" | "type"
type SortDirection = "asc" | "desc"

export default function FileManagerPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const [files, setFiles] = useState<FileData[]>([])
  const [folders, setFolders] = useState<FolderData[]>([])
  const [filteredItems, setFilteredItems] = useState<(FileData | FolderData)[]>([])
  const [currentFolder, setCurrentFolder] = useState<FolderData | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [draggedFile, setDraggedFile] = useState<FileData | null>(null)
  const [isDragOver, setIsDragOver] = useState<string | null>(null)

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showFolderViewModal, setShowFolderViewModal] = useState(false)

  // Form states
  const [editFormData, setEditFormData] = useState({
    name: "",
    title: "",
    description: "",
    category: "",
    priority: "",
    departments: [] as string[],
  })
  const [shareFormData, setShareFormData] = useState({
    departments: [] as string[],
    users: [] as string[],
    message: "",
  })
  const [folderFormData, setFolderFormData] = useState({
    name: "",
    description: "",
    accessLevel: "department" as "public" | "department" | "private",
    departments: [] as string[],
  })
  const [departments, setDepartments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

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
    const type = fileType.toLowerCase()
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (type.includes("image") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension || "")) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />
    }
    if (type.includes("video") || ["mp4", "avi", "mov", "wmv", "flv"].includes(extension || "")) {
      return <FileVideo className="w-8 h-8 text-purple-500" />
    }
    if (type.includes("audio") || ["mp3", "wav", "flac", "aac"].includes(extension || "")) {
      return <FileAudio className="w-8 h-8 text-green-500" />
    }
    if (["xlsx", "xls", "csv"].includes(extension || "")) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(extension || "")) {
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

  // Fetch folders and files
  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch folders
      const foldersResponse = await api.getFolders(authContext)
      if (foldersResponse.success && foldersResponse.data) {
        setFolders(foldersResponse.data.folders || [])
      }

      // Fetch files (filtered by current folder if selected)
      const filesParams = currentFolder ? { folderId: currentFolder._id } : {}
      const filesResponse = await api.getFiles(filesParams, authContext)
      if (filesResponse.success && filesResponse.data) {
        const filesData = filesResponse.data.files || []
        const processedFiles = filesData.map((file: any) => ({
          ...file,
          name: file.name || file.title || "Untitled",
          title: file.title || file.name || "Untitled",
          description: file.description || "No description",
          category: file.category || "Uncategorized",
          status: file.status || "draft",
          priority: file.priority || null,
          createdBy: {
            _id: file.createdBy?._id || "",
            firstName: file.createdBy?.firstName || "Unknown",
            lastName: file.createdBy?.lastName || "User",
            email: file.createdBy?.email || "",
            position: file.createdBy?.position || "",
          },
          file: {
            name: file.file?.name || "Unknown file",
            url: file.file?.url || "",
            size: file.file?.size || 0,
            type: file.file?.type || "",
          },
          folder: file.folder || null,
          departments: file.departments || [],
        }))
        setFiles(processedFiles)
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch departments and users
  const fetchDepartmentsAndUsers = async () => {
    try {
      const [deptResponse, usersResponse] = await Promise.all([
        api.getDepartments({ includeInactive: false }, authContext),
        api.getUsers(authContext),
      ])

      if (deptResponse.success && deptResponse.data) {
        setDepartments(deptResponse.data.departments || [])
      }

      if (usersResponse.success && usersResponse.data) {
        const filteredUsers = (usersResponse.data.users || []).filter((user) => user.role === "user")
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error("Error fetching departments and users:", error)
    }
  }

  useEffect(() => {
    if (authContext.isAuthenticated) {
      fetchData()
      fetchDepartmentsAndUsers()
    }
  }, [authContext, currentFolder])

  // Search and sort items
  useEffect(() => {
    let items: (FileData | FolderData)[] = []

    if (!currentFolder) {
      // At root level: show folders and files that are NOT in any folder (or in default folder)
      const rootFiles = files.filter((file) => !file.folder || file.folder.name === "puffingroup")
      items = [...folders, ...rootFiles]
    } else {
      // In a specific folder: show only files in that folder
      const folderFiles = files.filter((file) => file.folder && file.folder._id === currentFolder._id)
      items = folderFiles
    }

    // Filter by search term
    const filtered = items.filter((item) => {
      const name = "name" in item ? item.name : item.title || ""
      const description = item.description || ""
      const createdBy = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : ""

      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    // Sort items (folders first when not in a folder)
    filtered.sort((a, b) => {
      // If not in a folder, show folders first
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
  }, [files, folders, searchTerm, sortBy, sortDirection, currentFolder])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, file: FileData) => {
    setDraggedFile(file)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", file._id)
  }

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setIsDragOver(folderId)
  }

  const handleDragLeave = () => {
    setIsDragOver(null)
  }

  const handleDrop = async (e: React.DragEvent, targetFolder: FolderData) => {
    e.preventDefault()
    setIsDragOver(null)

    if (!draggedFile) return

    try {
      setIsProcessing(true)
      const response = await api.moveFileToFolder(draggedFile._id, targetFolder._id, authContext)

      if (response.success) {
        toast({
          title: "Success",
          description: `File moved to ${targetFolder.name}`,
        })
        fetchData() // Refresh data
      } else {
        throw new Error(response.message || "Failed to move file")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to move file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setDraggedFile(null)
    }
  }

  // Navigation
  const navigateToFolder = (folder: FolderData) => {
    setCurrentFolder(folder)
  }

  const navigateBack = () => {
    setCurrentFolder(null)
  }

  // Create folder
  const handleCreateFolder = async () => {
    try {
      setIsProcessing(true)
      const response = await api.createFolder(folderFormData, authContext)

      if (response.success) {
        toast({
          title: "Success",
          description: "Folder created successfully",
        })
        setShowCreateFolderModal(false)
        setFolderFormData({
          name: "",
          description: "",
          accessLevel: "department",
          departments: [],
        })
        fetchData()
      } else {
        throw new Error(response.message || "Failed to create folder")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Delete handlers
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
        fetchData() // Refresh to update folder counts
      } else {
        throw new Error(response.message || "Failed to delete file")
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

  const handleDeleteFolder = async () => {
    if (!selectedFolder) return

    try {
      setIsProcessing(true)
      const response = await api.deleteFolder(selectedFolder._id, authContext)

      if (response.success) {
        setFolders((prev) => prev.filter((folder) => folder._id !== selectedFolder._id))
        setShowDeleteDialog(false)
        setSelectedFolder(null)
        toast({
          title: "Success",
          description: "Folder deleted successfully",
        })
        fetchData()
      } else {
        throw new Error(response.message || "Failed to delete folder")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Edit handlers
  const handleEditSubmit = async () => {
    if (!selectedFile) return

    try {
      setIsProcessing(true)
      const response = await api.updateFile(selectedFile._id, editFormData, authContext)

      if (response.success) {
        setShowEditModal(false)
        toast({
          title: "Success",
          description: "File updated successfully",
        })
        fetchData()
      } else {
        throw new Error(response.message || "Failed to update file")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Share handlers
  const handleShareSubmit = async () => {
    if (!selectedFile && !selectedFolder) return

    try {
      setIsProcessing(true)
      let response

      if (selectedFile) {
        response = await api.shareFile(selectedFile._id, shareFormData, authContext)
      } else if (selectedFolder) {
        response = await api.shareFolder(selectedFolder._id, shareFormData, authContext)
      }

      if (response?.success) {
        setShowShareModal(false)
        toast({
          title: "Success",
          description: `${selectedFile ? "File" : "Folder"} shared successfully`,
        })
        fetchData()
      } else {
        throw new Error(response?.message || "Failed to share")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to share",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(option)
      setSortDirection("asc")
    }
  }

  const openViewModal = (file: FileData) => {
    setSelectedFile(file)
    setShowViewModal(true)
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

  const openEditModal = (file: FileData) => {
    setSelectedFile(file)
    setEditFormData({
      name: file.name,
      title: file.title,
      description: file.description,
      category: file.category,
      priority: file.priority || "medium",
      departments: file.departments.map((dept) => dept._id),
    })
    setShowEditModal(true)
  }

  const openShareModal = (item: FileData | FolderData) => {
    if ("file" in item) {
      setSelectedFile(item)
      setSelectedFolder(null)
    } else {
      setSelectedFolder(item)
      setSelectedFile(null)
    }
    setShareFormData({
      departments: [],
      users: [],
      message: "",
    })
    setShowShareModal(true)
  }

  const openFolderViewModal = (folder: FolderData) => {
    setSelectedFolder(folder)
    setShowFolderViewModal(true)
  }

  const handleDownload = async (file: FileData) => {
    try {
      const link = document.createElement("a")
      link.href = file.file.url
      link.download = file.file.name
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: `Downloading ${file.file.name}`,
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
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
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Home className="w-4 h-4" />
                <button
                  onClick={navigateBack}
                  className="hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  File Manager
                </button>
                {currentFolder && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className={`font-medium ${themeColors.text}`}>{currentFolder.name}</span>
                  </>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentFolder ? currentFolder.name : "File Manager"}
                </h1>
                <p className="text-gray-600">
                  {currentFolder ? currentFolder.description : "Organize and manage your files and folders"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Badge variant="outline" className={`${themeColors.border} ${themeColors.text} px-3 py-1`}>
                {filteredItems.length} Items
              </Badge>

              {!currentFolder && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreateFolderModal(true)}
                  className="flex items-center gap-2 hover:bg-gray-50 transition-all duration-200"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </Button>
              )}

              <Button
                onClick={() => setShowUploadModal(true)}
                className={`${themeColors.primary} hover:${themeColors.primaryHover} text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Controls */}
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

        {/* Enhanced Items Display */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-16 text-center">
              <div className={`w-20 h-20 rounded-full ${themeColors.bg} flex items-center justify-center mx-auto mb-6`}>
                <Folder className={`w-10 h-10 ${themeColors.text}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? "No items found" : currentFolder ? "Folder is empty" : "No items yet"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms or browse through folders"
                  : "Upload files or create folders to get started with organizing your content"}
              </p>
              {!searchTerm && !currentFolder && (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => setShowCreateFolderModal(true)}
                    variant="outline"
                    className="flex items-center gap-2 h-12 px-6 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <FolderPlus className="w-5 h-5" />
                    Create Folder
                  </Button>
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className={`${themeColors.primary} hover:${themeColors.primaryHover} text-white h-12 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {filteredItems.map((item) => {
                  const isFolder = !("file" in item)
                  const folder = isFolder ? (item as FolderData) : null
                  const file = !isFolder ? (item as FileData) : null

                  return (
                    <Card
                      key={item._id}
                      className={`group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md bg-white rounded-2xl overflow-hidden ${
                        draggedFile && isFolder ? `ring-2 ring-blue-400 ${themeColors.bg} transform scale-105` : ""
                      } ${isDragOver === item._id ? "ring-2 ring-blue-400 bg-blue-50" : ""}`}
                      onClick={() => {
                        if (isFolder) {
                          navigateToFolder(folder!)
                        } else {
                          openViewModal(file!)
                        }
                      }}
                      onDragOver={isFolder ? (e) => handleDragOver(e, item._id) : undefined}
                      onDragLeave={isFolder ? handleDragLeave : undefined}
                      onDrop={isFolder ? (e) => handleDrop(e, folder!) : undefined}
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

                        {/* Enhanced Action Menu */}
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
                              <DropdownMenuItem
                                onClick={() => {
                                  if (isFolder) {
                                    openFolderViewModal(folder!)
                                  } else {
                                    openViewModal(file!)
                                  }
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {!isFolder && (
                                <DropdownMenuItem onClick={() => handleDownload(file!)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              {((isFolder && folder!.canEdit) || (!isFolder && file!.canEdit)) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!isFolder) {
                                      openEditModal(file!)
                                    }
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {((isFolder && folder!.canShare) || (!isFolder && file!.canShare)) && (
                                <DropdownMenuItem onClick={() => openShareModal(item)}>
                                  <Share className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                              )}
                              {!isFolder && (
                                <DropdownMenuItem onClick={() => openShareModal(item)}>
                                  <Move className="w-4 h-4 mr-2" />
                                  Move to Folder
                                </DropdownMenuItem>
                              )}
                              {((isFolder && folder!.canDelete && !folder!.isDefault) ||
                                (!isFolder && file!.canDelete)) && (
                                <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Enhanced Status Indicators */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
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
                          {!isFolder && file!.sharedWithMe && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg"
                            >
                              Shared
                            </Badge>
                          )}
                          {isFolder && folder!.isDefault && (
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                              Default
                            </Badge>
                          )}
                        </div>

                        {/* Drag indicator for files */}
                        {!isFolder && (
                          <div
                            className="absolute inset-0 opacity-0 cursor-move"
                            draggable
                            onDragStart={(e) => handleDragStart(e, file!)}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Enhanced List View */}
            {viewMode === "list" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const isFolder = !("file" in item)
                    const folder = isFolder ? (item as FolderData) : null
                    const file = !isFolder ? (item as FileData) : null

                    return (
                      <div
                        key={item._id}
                        className={`flex items-center p-6 hover:bg-gray-50 cursor-pointer group transition-all duration-200 ${
                          draggedFile && isFolder ? "bg-blue-50 border-l-4 border-blue-400" : ""
                        } ${isDragOver === item._id ? "bg-blue-50 border-l-4 border-blue-400" : ""}`}
                        onClick={() => {
                          if (isFolder) {
                            navigateToFolder(folder!)
                          } else {
                            openViewModal(file!)
                          }
                        }}
                        draggable={!isFolder}
                        onDragStart={!isFolder ? (e) => handleDragStart(e, file!) : undefined}
                        onDragOver={isFolder ? (e) => handleDragOver(e, item._id) : undefined}
                        onDragLeave={isFolder ? handleDragLeave : undefined}
                        onDrop={isFolder ? (e) => handleDrop(e, folder!) : undefined}
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

                              {isFolder && folder!.isDefault && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg"
                                >
                                  Default
                                </Badge>
                              )}

                              {!isFolder && file!.sharedWithMe && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg"
                                >
                                  Shared
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

                        <div className="hidden md:flex items-center space-x-8 text-sm text-gray-500">
                          <span className="w-24 text-right font-medium">
                            {isFolder ? `${folder!.fileCount} files` : formatFileSize(file!.file.size)}
                          </span>
                          <span className="w-28 truncate">{isFolder ? folder!.accessLevel : file!.category}</span>
                          <span className="w-36 truncate">
                            {item.createdBy.firstName} {item.createdBy.lastName}
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
                              <DropdownMenuItem
                                onClick={() => {
                                  if (isFolder) {
                                    openFolderViewModal(folder!)
                                  } else {
                                    openViewModal(file!)
                                  }
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {!isFolder && (
                                <DropdownMenuItem onClick={() => handleDownload(file!)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              {((isFolder && folder!.canEdit) || (!isFolder && file!.canEdit)) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!isFolder) {
                                      openEditModal(file!)
                                    }
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {((isFolder && folder!.canShare) || (!isFolder && file!.canShare)) && (
                                <DropdownMenuItem onClick={() => openShareModal(item)}>
                                  <Share className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                              )}
                              {!isFolder && (
                                <DropdownMenuItem onClick={() => openShareModal(item)}>
                                  <Move className="w-4 h-4 mr-2" />
                                  Move to Folder
                                </DropdownMenuItem>
                              )}
                              {((isFolder && folder!.canDelete && !folder!.isDefault) ||
                                (!isFolder && file!.canDelete)) && (
                                <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
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
          </>
        )}

        {/* All the existing modals remain the same but with enhanced styling */}
        {/* Create Folder Modal */}
        <Dialog open={showCreateFolderModal} onOpenChange={setShowCreateFolderModal}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Create New Folder</DialogTitle>
              <DialogDescription>Create a new folder to organize your files</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="folder-name" className="text-sm font-medium">
                    Folder Name
                  </Label>
                  <Input
                    id="folder-name"
                    value={folderFormData.name}
                    onChange={(e) => setFolderFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter folder name"
                    className="mt-1 h-12 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="folder-access" className="text-sm font-medium">
                    Access Level
                  </Label>
                  <Select
                    value={folderFormData.accessLevel}
                    onValueChange={(value: "public" | "department" | "private") =>
                      setFolderFormData((prev) => ({ ...prev, accessLevel: value }))
                    }
                  >
                    <SelectTrigger className="mt-1 h-12 rounded-xl">
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - All users can access</SelectItem>
                      <SelectItem value="department">Department - Department members only</SelectItem>
                      <SelectItem value="private">Private - Only you can access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="folder-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="folder-description"
                  value={folderFormData.description}
                  onChange={(e) => setFolderFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter folder description"
                  rows={3}
                  className="mt-1 rounded-xl"
                />
              </div>
              {folderFormData.accessLevel === "department" && (
                <div>
                  <Label className="text-sm font-medium">Select Departments</Label>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-xl p-4">
                    {departments.map((dept) => (
                      <div key={dept._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
                        <Checkbox
                          checked={folderFormData.departments.includes(dept._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFolderFormData((prev) => ({
                                ...prev,
                                departments: [...prev.departments, dept._id],
                              }))
                            } else {
                              setFolderFormData((prev) => ({
                                ...prev,
                                departments: prev.departments.filter((id) => id !== dept._id),
                              }))
                            }
                          }}
                        />
                        <Label className="text-sm cursor-pointer flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          {dept.name} ({dept.code})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={isProcessing || !folderFormData.name.trim()}
                  className={`flex-1 h-12 rounded-xl ${themeColors.primary} hover:${themeColors.primaryHover} text-white`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Folder"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload File Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Upload New File</DialogTitle>
              <DialogDescription>
                Upload a file to {currentFolder ? currentFolder.name : "the default folder"}
              </DialogDescription>
            </DialogHeader>
            <FileUploadForm
              onClose={() => setShowUploadModal(false)}
              onSuccess={() => {
                setShowUploadModal(false)
                fetchData()
              }}
              authContext={authContext}
              themeColors={themeColors}
              currentFolder={currentFolder}
            />
          </DialogContent>
        </Dialog>

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
              <DialogDescription>File details and information</DialogDescription>
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
                    <Label className="text-sm font-medium text-gray-600">File Type</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedFile.file.type || "Unknown"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Created By</Label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedFile.createdBy.firstName} {selectedFile.createdBy.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{selectedFile.createdBy.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Created Date</Label>
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFile.departments.map((dept) => (
                      <Badge key={dept._id} variant="outline" className="text-xs rounded-lg">
                        <Building2 className="w-3 h-3 mr-1" />
                        {dept.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" asChild className="flex-1 h-12 rounded-xl bg-transparent">
                    <a href={selectedFile.file.url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  {selectedFile.canEdit && (
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-xl bg-transparent"
                      onClick={() => {
                        setShowViewModal(false)
                        openEditModal(selectedFile)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {selectedFile.canShare && (
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-xl bg-transparent"
                      onClick={() => {
                        setShowViewModal(false)
                        openShareModal(selectedFile)
                      }}
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  )}
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
              <DialogDescription>Folder details and information</DialogDescription>
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
                    <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                    <p className="text-sm text-gray-900 mt-1">{new Date(selectedFolder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Created By</Label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedFolder.createdBy.firstName} {selectedFolder.createdBy.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedFolder.createdBy.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Departments</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
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
                    <Eye className="w-4 h-4 mr-2" />
                    Open Folder
                  </Button>
                  {selectedFolder.canShare && (
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-xl bg-transparent"
                      onClick={() => {
                        setShowFolderViewModal(false)
                        openShareModal(selectedFolder)
                      }}
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">
                Delete {selectedFile ? "File" : "Folder"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete "{selectedFile ? selectedFile.name : selectedFolder?.name}"?
                {selectedFolder && " All files in this folder will need to be moved first."}
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing} className="h-12 rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={selectedFile ? handleDeleteFile : handleDeleteFolder}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700 h-12 rounded-xl"
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

        {/* Edit File Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit File: {selectedFile?.title}</DialogTitle>
              <DialogDescription>Update file information and settings</DialogDescription>
            </DialogHeader>
            {selectedFile && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title" className="text-sm font-medium">
                      Title
                    </Label>
                    <Input
                      id="edit-title"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="File title"
                      className="mt-1 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-category" className="text-sm font-medium">
                      Category
                    </Label>
                    <Select
                      value={editFormData.category}
                      onValueChange={(value) => setEditFormData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="mt-1 h-12 rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="File description"
                    rows={3}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-priority" className="text-sm font-medium">
                    Priority
                  </Label>
                  <Select
                    value={editFormData.priority}
                    onValueChange={(value) => setEditFormData((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="mt-1 h-12 rounded-xl">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1 h-12 rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={isProcessing}
                    className={`flex-1 h-12 rounded-xl ${themeColors.primary} hover:${themeColors.primaryHover} text-white`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update File"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Share Modal */}
        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Share {selectedFile ? "File" : "Folder"}: {selectedFile?.title || selectedFolder?.name}
              </DialogTitle>
              <DialogDescription>Select departments and users to share with</DialogDescription>
            </DialogHeader>
            {(selectedFile || selectedFolder) && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Current Departments</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(selectedFile?.departments || selectedFolder?.departments || []).map((dept) => (
                      <Badge key={dept._id} variant="outline" className="text-xs rounded-lg">
                        <Building2 className="w-3 h-3 mr-1" />
                        {dept.name} ({dept.code})
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Share with Additional Departments</Label>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-xl p-4">
                    {departments
                      .filter(
                        (dept) =>
                          !(selectedFile?.departments || selectedFolder?.departments || []).some(
                            (d) => d._id === dept._id,
                          ),
                      )
                      .map((dept) => (
                        <div key={dept._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
                          <Checkbox
                            checked={shareFormData.departments.includes(dept._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setShareFormData((prev) => ({
                                  ...prev,
                                  departments: [...prev.departments, dept._id],
                                }))
                              } else {
                                setShareFormData((prev) => ({
                                  ...prev,
                                  departments: prev.departments.filter((id) => id !== dept._id),
                                }))
                              }
                            }}
                          />
                          <Label className="text-sm cursor-pointer flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            {dept.name} ({dept.code})
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Share with Users</Label>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-xl p-4">
                    {users.map((user) => (
                      <div key={user._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
                        <Checkbox
                          checked={shareFormData.users.includes(user._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setShareFormData((prev) => ({
                                ...prev,
                                users: [...prev.users, user._id],
                              }))
                            } else {
                              setShareFormData((prev) => ({
                                ...prev,
                                users: prev.users.filter((id) => id !== user._id),
                              }))
                            }
                          }}
                        />
                        <div className="flex flex-col gap-1">
                          <Label className="text-sm cursor-pointer">
                            {user.firstName} {user.lastName} ({user.email})
                          </Label>
                          {user.department?.map((dept, index) => (
                            <Badge key={index} variant="secondary" className="text-xs rounded-lg">
                              {dept.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="share-message" className="text-sm font-medium">
                    Message (Optional)
                  </Label>
                  <Textarea
                    id="share-message"
                    value={shareFormData.message}
                    onChange={(e) => setShareFormData((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Add a message for the recipients..."
                    rows={3}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setShowShareModal(false)} className="flex-1 h-12 rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleShareSubmit}
                    disabled={
                      isProcessing || (shareFormData.departments.length === 0 && shareFormData.users.length === 0)
                    }
                    className={`flex-1 h-12 rounded-xl ${themeColors.primary} hover:${themeColors.primaryHover} text-white`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      `Share with ${shareFormData.departments.length + shareFormData.users.length} Recipient(s)`
                    )}
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
