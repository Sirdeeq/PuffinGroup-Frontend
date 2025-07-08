"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import {
  FileText,
  Plus,
  Share,
  Search,
  Download,
  Calendar,
  Loader2,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Grid3X3,
  List,
  ImageIcon,
  RefreshCw,
  SortAsc,
  SortDesc,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Database,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

interface FileData {
  _id: string
  title?: string
  name?: string
  description: string
  category?: string
  status?: string
  priority?: string
  approvalStatus?: string
  createdAt: string
  updatedAt: string
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
  departments?: Array<string>
  sharedWith: Array<any>
  requiresSignature?: boolean
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
  sharedWithMe: boolean
  comments?: Array<any>
  versions?: Array<any>
}

export default function AdminFilesPage() {
  const authContext = useAuth()
  const { toast } = useToast()
  const [allFiles, setAllFiles] = useState<FileData[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "status">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Selected file and modal states
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Redirect if not authenticated or not admin
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Admin theme colors
  const themeColors = {
    primary: "bg-gradient-to-r from-orange-500 to-orange-600",
    primaryHover: "bg-gradient-to-r from-orange-600 to-orange-700",
    bg: "bg-orange-50",
    text: "text-orange-600",
    badge: "bg-orange-100",
    badgeText: "text-orange-800",
    border: "border-orange-200",
    accent: "bg-orange-500",
  }

  // Fetch all files for admin
  useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        setLoading(true)
        console.log("Fetching all files for admin...")

        // Admin should see ALL files across all departments
        const response = await api.getFiles({ role: "admin", includeAll: true }, authContext)
        console.log("Admin Files API Response:", response)

        if (response.success) {
          let files = []

          // Handle different response structures
          if (response.files && Array.isArray(response.files)) {
            files = response.files
          } else if (response.data && response.data.files && Array.isArray(response.data.files)) {
            files = response.data.files
          } else if (Array.isArray(response.data)) {
            files = response.data
          }

          console.log(`Loaded ${files.length} files for admin`)
          setAllFiles(files)
          setFilteredFiles(files)
        } else {
          console.warn("Failed to fetch files:", response.message)
          setAllFiles([])
          setFilteredFiles([])
        }
      } catch (error) {
        console.error("Error fetching admin files:", error)
        toast({
          title: "Error",
          description: "Failed to load files. Please try again.",
          variant: "destructive",
        })
        setAllFiles([])
        setFilteredFiles([])
      } finally {
        setLoading(false)
      }
    }

    if (authContext.user?.role === "admin") {
      fetchAllFiles()
    }
  }, [authContext, toast])

  // Filter and sort files
  useEffect(() => {
    if (!Array.isArray(allFiles)) {
      setFilteredFiles([])
      return
    }

    const filtered = allFiles.filter((file) => {
      const fileName = file.title || file.name || ""
      const fileCategory = file.category || ""
      const creatorName = `${file.createdBy?.firstName || ""} ${file.createdBy?.lastName || ""}`.trim()
      const fileDescription = file.description || ""

      const matchesSearch =
        fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fileCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fileDescription.toLowerCase().includes(searchTerm.toLowerCase())

      const fileStatus = file.status || file.approvalStatus || "active"
      const matchesStatus = filterStatus === "all" || fileStatus.toLowerCase() === filterStatus.toLowerCase()

      return matchesSearch && matchesStatus
    })

    // Sort files
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "name":
          aValue = (a.title || a.name || "").toLowerCase()
          bValue = (b.title || b.name || "").toLowerCase()
          break
        case "date":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case "size":
          aValue = a.file.size
          bValue = b.file.size
          break
        case "status":
          aValue = a.status || a.approvalStatus || "active"
          bValue = b.status || b.approvalStatus || "active"
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
  }, [allFiles, searchTerm, filterStatus, sortBy, sortDirection])

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
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "sent_back":
        return "bg-red-100 text-red-800 border-red-200"
      case "rejected":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "draft":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string, fileName: string) => {
    const type = fileType?.toLowerCase() || ""
    const extension = fileName?.split(".").pop()?.toLowerCase() || ""

    if (type.includes("image") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) {
      return <ImageIcon className="w-6 h-6 text-blue-500" />
    }
    if (type.includes("video") || ["mp4", "avi", "mov", "wmv", "flv"].includes(extension)) {
      return <FileVideo className="w-6 h-6 text-purple-500" />
    }
    if (type.includes("audio") || ["mp3", "wav", "flac", "aac"].includes(extension)) {
      return <FileAudio className="w-6 h-6 text-green-500" />
    }
    if (["xlsx", "xls", "csv"].includes(extension)) {
      return <FileSpreadsheet className="w-6 h-6 text-green-600" />
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
      return <Archive className="w-6 h-6 text-orange-500" />
    }
    return <FileText className="w-6 h-6 text-gray-600" />
  }

  const getFileStats = () => {
    const safeFiles = Array.isArray(allFiles) ? allFiles : []
    return {
      total: safeFiles.length,
      draft: safeFiles.filter((f) => (f.status || f.approvalStatus) === "draft").length,
      pending: safeFiles.filter((f) => (f.status || f.approvalStatus) === "pending").length,
      approved: safeFiles.filter((f) => (f.status || f.approvalStatus) === "approved").length,
      active: safeFiles.filter((f) => (f.status || f.approvalStatus) === "active" || (!f.status && !f.approvalStatus))
        .length,
      shared: safeFiles.filter((f) => f.sharedWith && f.sharedWith.length > 0).length,
    }
  }

  const fileStats = getFileStats()

  const getStatusCounts = () => {
    const safeFiles = Array.isArray(allFiles) ? allFiles : []
    return {
      all: safeFiles.length,
      draft: safeFiles.filter((f) => (f.status || f.approvalStatus)?.toLowerCase() === "draft").length,
      active: safeFiles.filter(
        (f) => (f.status || f.approvalStatus)?.toLowerCase() === "active" || (!f.status && !f.approvalStatus),
      ).length,
      pending: safeFiles.filter((f) => (f.status || f.approvalStatus)?.toLowerCase() === "pending").length,
      approved: safeFiles.filter((f) => (f.status || f.approvalStatus)?.toLowerCase() === "approved").length,
      rejected: safeFiles.filter((f) => (f.status || f.approvalStatus)?.toLowerCase() === "rejected").length,
      sent_back: safeFiles.filter((f) => (f.status || f.approvalStatus)?.toLowerCase() === "sent_back").length,
    }
  }

  const statusCounts = getStatusCounts()

  const toggleSort = (option: typeof sortBy) => {
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

  const refreshFiles = () => {
    setLoading(true)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 rounded-full ${themeColors.accent} animate-pulse mx-auto`} />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Loading Admin File Manager</h3>
              <p className="text-gray-600">Fetching all files across departments...</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Database className="w-4 h-4 animate-pulse" />
                <span>Accessing system files</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="space-y-8 p-8">
        {/* Enhanced Admin Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl ${themeColors.bg}`}>
                <Shield className={`w-8 h-8 ${themeColors.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">Admin File Manager</h1>
                  <Badge className={`${themeColors.badge} ${themeColors.badgeText} px-3 py-1 text-sm font-medium`}>
                    SYSTEM ADMIN
                  </Badge>
                </div>
                <p className="text-gray-600 text-lg">Complete oversight of all files across departments and users</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    <span>System-wide access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>All departments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    <span>Real-time monitoring</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={refreshFiles}
                disabled={loading}
                className="flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 bg-transparent h-12 px-6"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                Refresh System
              </Button>

              {/* <Link href="/files/create">
                <Button
                  className={`${themeColors.primary} hover:${themeColors.primaryHover} text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 h-12 px-6`}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New File
                </Button>
              </Link> */}
            </div>
          </div>
        </div>

        {/* Enhanced Admin Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Files</p>
                  <p className="text-3xl font-bold text-blue-900">{fileStats.total}</p>
                  <p className="text-xs text-blue-500 mt-1">System-wide</p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-200">
                  <Database className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Drafts</p>
                  <p className="text-3xl font-bold text-purple-900">{fileStats.draft}</p>
                  <p className="text-xs text-purple-500 mt-1">In progress</p>
                </div>
                <div className="p-3 rounded-2xl bg-purple-200">
                  <Edit className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-900">{fileStats.pending}</p>
                  <p className="text-xs text-orange-500 mt-1">Awaiting review</p>
                </div>
                <div className="p-3 rounded-2xl bg-orange-200">
                  <Clock className="w-6 h-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Approved</p>
                  <p className="text-3xl font-bold text-green-900">{fileStats.approved}</p>
                  <p className="text-xs text-green-500 mt-1">Completed</p>
                </div>
                <div className="p-3 rounded-2xl bg-green-200">
                  <TrendingUp className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-indigo-50 to-indigo-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-indigo-900">{fileStats.active}</p>
                  <p className="text-xs text-indigo-500 mt-1">In circulation</p>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-200">
                  <Activity className="w-6 h-6 text-indigo-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-teal-50 to-teal-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-600 mb-1">Shared</p>
                  <p className="text-3xl font-bold text-teal-900">{fileStats.shared}</p>
                  <p className="text-xs text-teal-500 mt-1">Collaborative</p>
                </div>
                <div className="p-3 rounded-2xl bg-teal-200">
                  <Share className="w-6 h-6 text-teal-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search across all files, creators, categories, and descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl transition-all duration-200 text-base"
              />
            </div>

            <div className="flex items-center space-x-3">
              {/* Sort Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 px-4 rounded-xl hover:bg-gray-50 bg-transparent">
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
                  <DropdownMenuItem onClick={() => toggleSort("status")}>
                    Status {sortBy === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                    viewMode === "card" ? themeColors.primary : "hover:bg-gray-200"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                    viewMode === "table" ? themeColors.primary : "hover:bg-gray-200"
                  }`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced File Management Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
            <TabsList className="grid w-full grid-cols-7 bg-gray-50 rounded-xl p-1">
              <TabsTrigger
                value="all"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Draft ({statusCounts.draft})
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Active ({statusCounts.active})
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Pending ({statusCounts.pending})
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Approved ({statusCounts.approved})
              </TabsTrigger>
              <TabsTrigger
                value="sent_back"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Sent Back ({statusCounts.sent_back})
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Rejected ({statusCounts.rejected})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filterStatus} className="space-y-6">
            {!Array.isArray(filteredFiles) || filteredFiles.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="p-16 text-center">
                  <div
                    className={`w-20 h-20 rounded-full ${themeColors.bg} flex items-center justify-center mx-auto mb-6`}
                  >
                    <Database className={`w-10 h-10 ${themeColors.text}`} />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {searchTerm || filterStatus !== "all" ? "No files found" : "No files in system"}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search terms or filter criteria"
                      : "No files have been uploaded to the system yet"}
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <Link href="/files/create">
                      <Button
                        className={`${themeColors.primary} hover:${themeColors.primaryHover} text-white h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create First File
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Enhanced Card View */}
                {viewMode === "card" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredFiles.map((file) => (
                      <Card
                        key={file._id}
                        className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white rounded-2xl overflow-hidden hover:-translate-y-1"
                      >
                        <CardHeader className="pb-4 p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                                {getFileIcon(file.file.type, file.file.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle
                                  className="text-lg truncate group-hover:text-blue-600 transition-colors duration-200"
                                  title={file.title || file.name}
                                >
                                  {file.title || file.name || "Untitled"}
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                  {file.createdBy?.firstName} {file.createdBy?.lastName}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 rounded-xl hover:bg-gray-100"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openViewModal(file)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {file.canEdit && (
                                  <DropdownMenuItem onClick={() => openEditModal(file)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit File
                                  </DropdownMenuItem>
                                )}
                                {file.canShare && (
                                  <DropdownMenuItem onClick={() => openShareModal(file)}>
                                    <Share className="w-4 h-4 mr-2" />
                                    Share File
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                  <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </a>
                                </DropdownMenuItem>
                                {file.canDelete && (
                                  <DropdownMenuItem onClick={() => openDeleteDialog(file)} className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6 pt-0">
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed" title={file.description}>
                            {file.description || "No description provided"}
                          </p>

                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.file.size)}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {file.category && (
                              <Badge variant="outline" className="text-xs capitalize rounded-lg">
                                {file.category}
                              </Badge>
                            )}
                            <Badge
                              className={`text-xs rounded-lg ${getStatusColor(file.status || file.approvalStatus || "active")}`}
                            >
                              {file.status || file.approvalStatus || "Active"}
                            </Badge>
                            {file.priority && (
                              <Badge className={`text-xs rounded-lg ${getPriorityColor(file.priority)}`}>
                                {file.priority}
                              </Badge>
                            )}
                          </div>

                          {file.sharedWith && file.sharedWith.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-lg">
                              <Share className="w-3 h-3" />
                              <span>
                                Shared with {file.sharedWith.length} recipient{file.sharedWith.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}

                          <div className="flex space-x-2 pt-2 border-t border-gray-100">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewModal(file)}
                              className="flex-1 rounded-xl hover:bg-gray-50"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="ghost" asChild className="rounded-xl hover:bg-gray-50">
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

                {/* Enhanced Table View */}
                {viewMode === "table" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow className="hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900 py-4">File</TableHead>
                          <TableHead className="font-semibold text-gray-900">Creator</TableHead>
                          <TableHead className="font-semibold text-gray-900">Category</TableHead>
                          <TableHead className="font-semibold text-gray-900">Priority</TableHead>
                          <TableHead className="font-semibold text-gray-900">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900">Created</TableHead>
                          <TableHead className="font-semibold text-gray-900">Size</TableHead>
                          <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFiles.map((file) => (
                          <TableRow key={file._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-4">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                                  {getFileIcon(file.file.type, file.file.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 truncate" title={file.title || file.name}>
                                    {file.title || file.name || "Untitled"}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate max-w-xs" title={file.description}>
                                    {file.description || "No description"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">
                                  {file.createdBy?.firstName || ""} {file.createdBy?.lastName || ""}
                                </p>
                                <p className="text-gray-500 truncate max-w-xs" title={file.createdBy?.email}>
                                  {file.createdBy?.email || ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {file.category ? (
                                <Badge variant="outline" className="capitalize rounded-lg">
                                  {file.category}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {file.priority ? (
                                <Badge className={`${getPriorityColor(file.priority)} rounded-lg`} variant="outline">
                                  {file.priority}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${getStatusColor(file.status || file.approvalStatus || "active")} rounded-lg`}
                                variant="outline"
                              >
                                {file.status || file.approvalStatus || "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="text-gray-900">{new Date(file.createdAt).toLocaleDateString()}</p>
                                <p className="text-gray-500">{new Date(file.createdAt).toLocaleTimeString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium text-gray-900">
                                {formatFileSize(file.file.size)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openViewModal(file)}
                                  className="rounded-xl hover:bg-gray-100"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {file.canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(file)}
                                    className="rounded-xl hover:bg-gray-100"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                {file.canShare && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openShareModal(file)}
                                    className="rounded-xl hover:bg-gray-100"
                                  >
                                    <Share className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-gray-100">
                                  <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                                {file.canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(file)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced View File Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                {selectedFile && (
                  <div className="p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                    {getFileIcon(selectedFile.file.type, selectedFile.file.name)}
                  </div>
                )}
                {selectedFile?.title || selectedFile?.name}
              </DialogTitle>
              <DialogDescription>Complete file information and system details</DialogDescription>
            </DialogHeader>
            {selectedFile && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">File Title</Label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedFile.title || selectedFile.name || "Untitled"}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Category</Label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedFile.category || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedFile.description || "No description provided"}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Priority</Label>
                    {selectedFile.priority ? (
                      <Badge className={`${getPriorityColor(selectedFile.priority)} mt-1`} variant="outline">
                        {selectedFile.priority}
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">Not specified</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge
                      className={`${getStatusColor(selectedFile.status || selectedFile.approvalStatus || "active")} mt-1`}
                      variant="outline"
                    >
                      {selectedFile.status || selectedFile.approvalStatus || "Active"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Created By</Label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedFile.createdBy?.firstName || ""} {selectedFile.createdBy?.lastName || ""}
                    </p>
                    <p className="text-xs text-gray-500">{selectedFile.createdBy?.email || ""}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                    <p className="text-sm text-gray-900 mt-1">{new Date(selectedFile.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {selectedFile.sharedWith && selectedFile.sharedWith.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <Label className="text-sm font-medium text-blue-600">
                      Shared With ({selectedFile.sharedWith.length})
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFile.sharedWith.map((share, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-white">
                          <Share className="w-3 h-3 mr-1" />
                          {share.type === "department"
                            ? `${share.departmentId?.name || "Department"} (${share.departmentId?.code || ""})`
                            : "User"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-sm font-medium text-gray-600">File Attachment</Label>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl mt-2 bg-white">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(selectedFile.file.type, selectedFile.file.name)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(selectedFile.file.size)}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="rounded-xl bg-transparent">
                      <a href={selectedFile.file.url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>

                {selectedFile.comments && selectedFile.comments.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium text-gray-600">
                      Comments ({selectedFile.comments.length})
                    </Label>
                    <div className="space-y-3 mt-3 max-h-40 overflow-y-auto">
                      {selectedFile.comments.map((comment, index) => (
                        <div key={index} className="p-3 bg-white rounded-xl border border-gray-200">
                          <p className="text-sm text-gray-900">{comment.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowViewModal(false)} className="rounded-xl">
                    Close
                  </Button>
                  {selectedFile.canEdit && (
                    <Button
                      onClick={() => {
                        setShowViewModal(false)
                        openEditModal(selectedFile)
                      }}
                      className={`${themeColors.primary} hover:${themeColors.primaryHover} text-white rounded-xl`}
                    >
                      Edit File
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">Delete File</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to permanently delete "{selectedFile?.title || selectedFile?.name}"? This action
                cannot be undone and will remove the file from the entire system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing} className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFile}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700 rounded-xl"
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
    </div>
  )
}
