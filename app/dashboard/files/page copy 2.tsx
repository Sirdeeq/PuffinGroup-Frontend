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
    Inbox,
    Share,
    Search,
    Download,
    Calendar,
    User,
    Loader2,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Grid3X3,
    List,
    ImageIcon,
    RefreshCw,
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

  export default function FilesPageEnhanced() {
    const authContext = useAuth()
    const { toast } = useToast()
    const [allFiles, setAllFiles] = useState<FileData[]>([])
    const [filteredFiles, setFilteredFiles] = useState<FileData[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"card" | "table">("card")
    const [isProcessing, setIsProcessing] = useState(false)

    // Selected file and modal states
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)

    // Redirect if not authenticated
    if (!authContext.isAuthenticated) {
      redirect("/login")
    }

    // Fetch all files based on user role
    useEffect(() => {
      const fetchAllFiles = async () => {
        try {
          setLoading(true)
          console.log("Fetching files...")

          // Get user info first to determine permissions
          const userResponse = await api.getUser(authContext)
          if (!userResponse.success || !userResponse.data) {
            throw new Error("Failed to fetch user information")
          }

          const user = userResponse.data
          const queryParams: any = {}

          // Filter files based on user role
          if (user.role === "admin") {
            queryParams.role = "admin"
          } else if (user.role === "department" || user.role === "director") {
            const departmentId = Array.isArray(user.department) ? user.department[0] : user.department
            if (departmentId) {
              queryParams.department = departmentId
            }
          }

          const response = await api.getFiles(queryParams, authContext)
          console.log("Files API Response:", response)

          if (response.success && response.files) {
            // Handle the response structure properly
            const files = Array.isArray(response.files) ? response.files : []
            setAllFiles(files)
            setFilteredFiles(files)
          } else if (response.success && response.data && response.data.files) {
            // Alternative response structure
            const files = Array.isArray(response.data.files) ? response.data.files : []
            setAllFiles(files)
            setFilteredFiles(files)
          } else {
            console.warn("Unexpected response structure:", response)
            setAllFiles([])
            setFilteredFiles([])
          }
        } catch (error) {
          console.error("Error fetching files:", error)
          toast({
            title: "Error",
            description: "Failed to load files",
            variant: "destructive",
          })
          setAllFiles([])
          setFilteredFiles([])
        } finally {
          setLoading(false)
        }
      }

      fetchAllFiles()
    }, [authContext, toast])

    // Filter files based on search term and status
    useEffect(() => {
      if (!Array.isArray(allFiles)) {
        setFilteredFiles([])
        return
      }

      const filtered = allFiles.filter((file) => {
        const fileName = file.title || file.name || ""
        const fileCategory = file.category || ""
        const creatorName = `${file.createdBy?.firstName || ""} ${file.createdBy?.lastName || ""}`.trim()

        const matchesSearch =
          fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fileCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
          creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (file.description || "").toLowerCase().includes(searchTerm.toLowerCase())

        // Handle status filtering - use different fields based on what's available
        const fileStatus = file.status || file.approvalStatus || "active"
        const matchesStatus = filterStatus === "all" || fileStatus.toLowerCase() === filterStatus.toLowerCase()

        return matchesSearch && matchesStatus
      })

      setFilteredFiles(filtered)
    }, [allFiles, searchTerm, filterStatus])

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

    const getFileIcon = (fileType: string) => {
      if (fileType?.startsWith("image/")) {
        return <ImageIcon className="w-5 h-5 text-blue-600" />
      } else if (fileType?.includes("pdf")) {
        return <FileText className="w-5 h-5 text-red-600" />
      } else {
        return <FileText className="w-5 h-5 text-gray-600" />
      }
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
      // Re-trigger the useEffect
      window.location.reload()
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading files...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your files</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">File Management</h1>
            <p className="text-slate-600 mt-1">
              {authContext.user?.role === "admin"
                ? "Manage all files across departments"
                : "Manage your files and documents"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshFiles}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/files/create">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Create New File
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Files</p>
                  <p className="text-2xl font-bold text-slate-800">{fileStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-purple-100">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Drafts</p>
                  <p className="text-2xl font-bold text-slate-800">{fileStats.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-orange-100">
                  <Inbox className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-slate-800">{fileStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-green-100">
                  <Share className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Approved</p>
                  <p className="text-2xl font-bold text-slate-800">{fileStats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search files by name, category, or creator..."
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

        {/* All Files by Status */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
            <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
            <TabsTrigger value="sent_back">Sent Back ({statusCounts.sent_back})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus} className="space-y-4">
            {!Array.isArray(filteredFiles) || filteredFiles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">No files found</h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "No files available. Create your first file to get started."}
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <Link href="/files/create">
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First File
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Card View */}
                {viewMode === "card" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFiles.map((file) => (
                      <Card
                        key={file._id}
                        className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="p-2 rounded-full bg-blue-100">{getFileIcon(file.file.type)}</div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate" title={file.title || file.name}>
                                  {file.title || file.name || "Untitled"}
                                </CardTitle>
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

                        <CardContent className="space-y-4">
                          <p className="text-sm text-slate-600 line-clamp-2" title={file.description}>
                            {file.description || "No description provided"}
                          </p>

                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <User className="w-3 h-3" />
                            <span>
                              {file.createdBy?.firstName || ""} {file.createdBy?.lastName || ""}
                            </span>
                            <span>•</span>
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {file.category && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {file.category}
                              </Badge>
                            )}
                            <Badge
                              className={`text-xs ${getStatusColor(file.status || file.approvalStatus || "active")}`}
                            >
                              {file.status || file.approvalStatus || "Active"}
                            </Badge>
                            {file.priority && (
                              <Badge className={`text-xs ${getPriorityColor(file.priority)}`}>{file.priority}</Badge>
                            )}
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="truncate max-w-[70%]" title={file.file.name}>
                                {file.file.name}
                              </span>
                              <span>{formatFileSize(file.file.size)}</span>
                            </div>
                          </div>

                          {file.sharedWith && file.sharedWith.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Share className="w-3 h-3" />
                              <span>
                                Shared with {file.sharedWith.length} recipient{file.sharedWith.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openViewModal(file)} className="flex-1">
                              <Eye className="w-3 h-3 mr-1" />
                              View
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
                            <TableHead>Size</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFiles.map((file) => (
                            <TableRow key={file._id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 rounded-full bg-blue-100">{getFileIcon(file.file.type)}</div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate" title={file.title || file.name}>
                                      {file.title || file.name || "Untitled"}
                                    </p>
                                    <p className="text-sm text-slate-500 truncate max-w-xs" title={file.description}>
                                      {file.description || "No description"}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">
                                    {file.createdBy?.firstName || ""} {file.createdBy?.lastName || ""}
                                  </p>
                                  <p className="text-slate-500 truncate max-w-xs" title={file.createdBy?.email}>
                                    {file.createdBy?.email || ""}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {file.category ? (
                                  <Badge variant="outline" className="capitalize">
                                    {file.category}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {file.priority ? (
                                  <Badge className={getPriorityColor(file.priority)} variant="outline">
                                    {file.priority}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getStatusColor(file.status || file.approvalStatus || "active")}
                                  variant="outline"
                                >
                                  {file.status || file.approvalStatus || "Active"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{new Date(file.createdAt).toLocaleDateString()}</p>
                                  <p className="text-slate-500">{new Date(file.createdAt).toLocaleTimeString()}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{formatFileSize(file.file.size)}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <Button variant="ghost" size="sm" onClick={() => openViewModal(file)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {file.canEdit && (
                                    <Button variant="ghost" size="sm" onClick={() => openEditModal(file)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {file.canShare && (
                                    <Button variant="ghost" size="sm" onClick={() => openShareModal(file)}>
                                      <Share className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </Button>
                                  {file.canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openDeleteDialog(file)}
                                      className="text-red-600 hover:text-red-700"
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
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* View File Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>File Details: {selectedFile?.title || selectedFile?.name}</DialogTitle>
              <DialogDescription>Complete information about this file</DialogDescription>
            </DialogHeader>
            {selectedFile && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <p className="text-sm font-medium">{selectedFile.title || selectedFile.name || "Untitled"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-sm font-medium">{selectedFile.category || "Not specified"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedFile.description || "No description provided"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    {selectedFile.priority ? (
                      <Badge className={getPriorityColor(selectedFile.priority)} variant="outline">
                        {selectedFile.priority}
                      </Badge>
                    ) : (
                      <p className="text-sm">Not specified</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge
                      className={getStatusColor(selectedFile.status || selectedFile.approvalStatus || "active")}
                      variant="outline"
                    >
                      {selectedFile.status || selectedFile.approvalStatus || "Active"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                    <p className="text-sm">
                      {selectedFile.createdBy?.firstName || ""} {selectedFile.createdBy?.lastName || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedFile.createdBy?.email || ""}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                    <p className="text-sm">{new Date(selectedFile.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {selectedFile.sharedWith && selectedFile.sharedWith.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Shared With</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedFile.sharedWith.map((share, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Share className="w-3 h-3 mr-1" />
                          {share.type === "department"
                            ? `${share.departmentId?.name || "Department"} (${share.departmentId?.code || ""})`
                            : "User"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Attachment</Label>
                  <div className="flex items-center justify-between p-3 border rounded-lg mt-1">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(selectedFile.file.type)}
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

                {selectedFile.comments && selectedFile.comments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Comments ({selectedFile.comments.length})
                    </Label>
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                      {selectedFile.comments.map((comment, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm">
                          <p>{comment.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowViewModal(false)}>
                    Close
                  </Button>
                  {selectedFile.canEdit && (
                    <Button
                      onClick={() => {
                        setShowViewModal(false)
                        openEditModal(selectedFile)
                      }}
                    >
                      Edit File
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
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the file "
                {selectedFile?.title || selectedFile?.name}".
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
