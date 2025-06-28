"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import FileUploadForm from "@/components/file-upload-form"

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

type SortOption = "name" | "date" | "size" | "type"
type SortDirection = "asc" | "desc"

export default function FileManagerPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const [files, setFiles] = useState<FileData[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([])
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    departments: [] as string[],
  })
  const [shareFormData, setShareFormData] = useState({
    departments: [] as string[],
    message: "",
  })
  const [departments, setDepartments] = useState<any[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)

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

  // Fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await api.getFiles("", authContext)

      if (!response.success) {
        throw new Error(response.message || "Failed to load files")
      }

      const filesData = response.data.files || []
      const processedFiles = filesData.map((file: any) => ({
        ...file,
        title: file.title || "Untitled",
        description: file.description || "No description",
        category: file.category || "Uncategorized",
        status: file.status || "draft",
        priority: file.priority || null,
        departmentNames: file.departments?.map((dept: any) => dept.name) || [],
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
        departments: file.departments || [],
      }))

      setFiles(processedFiles)
      setFilteredFiles(processedFiles)
    } catch (error: any) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
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
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
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

  const openViewModal = (file: FileData) => {
    setSelectedFile(file)
    setShowViewModal(true)
  }

  const openDeleteDialog = (file: FileData) => {
    setSelectedFile(file)
    setShowDeleteDialog(true)
  }

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(option)
      setSortDirection("asc")
    }
  }

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true)
      const response = await api.getDepartments({ includeInactive: false }, authContext)
      if (response.success && response.data) {
        setDepartments(response.data.departments || [])
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      })
    } finally {
      setLoadingDepartments(false)
    }
  }

  // Open edit modal
  const openEditModal = (file: FileData) => {
    setSelectedFile(file)
    setEditFormData({
      title: file.title,
      description: file.description,
      category: file.category,
      priority: file.priority || "medium",
      departments: file.departments.map((dept) => dept._id),
    })
    setShowEditModal(true)
  }

  // Open share modal
  const openShareModal = (file: FileData) => {
    setSelectedFile(file)
    setShareFormData({
      departments: [],
      message: "",
    })
    setShowShareModal(true)
  }

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!selectedFile) return

    try {
      setIsProcessing(true)
      const response = await api.updateFile(selectedFile._id, editFormData, authContext)

      if (response.success) {
        // Update the file in the list
        setFiles((prev) =>
          prev.map((file) =>
            file._id === selectedFile._id
              ? {
                  ...file,
                  ...editFormData,
                  departments: departments.filter((dept) => editFormData.departments.includes(dept._id)),
                }
              : file,
          ),
        )
        setShowEditModal(false)
        toast({
          title: "Success",
          description: "File updated successfully",
        })
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

  // Handle share submit
  const handleShareSubmit = async () => {
    if (!selectedFile) return

    try {
      setIsProcessing(true)
      const response = await api.shareFile(selectedFile._id, shareFormData, authContext)

      if (response.success) {
        setShowShareModal(false)
        toast({
          title: "Success",
          description: `File shared with ${shareFormData.departments.length} department(s)`,
        })
      } else {
        throw new Error(response.message || "Failed to share file")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to share file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle download
  const handleDownload = async (file: FileData) => {
    try {
      // Create a temporary link and trigger download
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

  useEffect(() => {
    if (authContext.isAuthenticated) {
      fetchDepartments()
    }
  }, [authContext])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`h-8 w-8 animate-spin text-${themeColors.text}`} />
        <span className="ml-2 text-gray-600">Loading files...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">File Manager</h1>
          <p className="text-slate-600 mt-1">Organize and manage your files</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            disabled={loading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge variant="outline" className={`text-${themeColors.text} border-${themeColors.text}`}>
            {filteredFiles.length} Files
          </Badge>
          <Button
            onClick={() => setShowUploadModal(true)}
            className={`bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search files and folders..."
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
              <DropdownMenuItem onClick={() => toggleSort("size")}>
                Size {sortBy === "size" && (sortDirection === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("type")}>
                Type {sortBy === "type" && (sortDirection === "asc" ? "↑" : "↓")}
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
            <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              {searchTerm ? "No files found" : "No files yet"}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm ? "Try adjusting your search terms" : "Upload your first file to get started"}
            </p>
            {!searchTerm && (
              <Link href="/dashboard/files/create">
                <Button className={`bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First File
                </Button>
              </Link>
            )}
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
                    <h3 className="font-medium text-sm truncate mb-1" title={file.title}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">{formatFileSize(file.file.size)}</p>
                    <p className="text-xs text-slate-400">{formatDate(file.createdAt)}</p>

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
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          {file.canEdit && (
                            <DropdownMenuItem onClick={() => openEditModal(file)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {file.canShare && (
                            <DropdownMenuItem onClick={() => openShareModal(file)}>
                              <Share className="w-4 h-4 mr-2" />
                              Share
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

                    {/* Status Indicators */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {file.sharedWithMe && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          Shared
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
                        <span className="w-24">{file.category}</span>
                        <span className="w-32">
                          {file.createdBy.firstName} {file.createdBy.lastName}
                        </span>
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
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {file.canEdit && (
                              <DropdownMenuItem onClick={() => openEditModal(file)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {file.canShare && (
                              <DropdownMenuItem onClick={() => openShareModal(file)}>
                                <Share className="w-4 h-4 mr-2" />
                                Share
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
              {selectedFile?.title}
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
                  <Label className="text-sm font-medium text-muted-foreground">File Type</Label>
                  <p className="text-sm">{selectedFile.file.type || "Unknown"}</p>
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
                {selectedFile.canEdit && (
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {selectedFile.canShare && (
                  <Button variant="outline" className="flex-1 bg-transparent">
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

      {/* Edit File Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit File: {selectedFile?.title}</DialogTitle>
            <DialogDescription>Update file information and settings</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="File title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(value) => setEditFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
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
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="File description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editFormData.priority}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
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

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  disabled={isProcessing}
                  className={`flex-1 bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
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

      {/* Share File Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share File: {selectedFile?.title}</DialogTitle>
            <DialogDescription>Select departments to share this file with</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Departments</Label>
                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
                  {selectedFile.departments.map((dept) => (
                    <Badge key={dept._id} variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {dept.name} ({dept.code})
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Share with Additional Departments</Label>
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {departments
                    .filter((dept) => !selectedFile.departments.some((d) => d._id === dept._id))
                    .map((dept) => (
                      <div key={dept._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
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
                <Label htmlFor="share-message">Message (Optional)</Label>
                <Textarea
                  id="share-message"
                  value={shareFormData.message}
                  onChange={(e) => setShareFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a message for the recipients..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowShareModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleShareSubmit}
                  disabled={isProcessing || shareFormData.departments.length === 0}
                  className={`flex-1 bg-${themeColors.primary} hover:bg-${themeColors.primaryHover} text-white`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    `Share with ${shareFormData.departments.length} Department(s)`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload File Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New File</DialogTitle>
            <DialogDescription>Create and submit a new file for processing</DialogDescription>
          </DialogHeader>
          <FileUploadForm
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false)
              fetchFiles()
            }}
            authContext={authContext}
            themeColors={themeColors}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
