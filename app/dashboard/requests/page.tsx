"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  User,
  Building2,
  AlertCircle,
  Loader2,
  Grid3X3,
  List,
  FileText,
  Paperclip,
  CheckCircle,
  PenTool,
  Clock,
  XCircle,
  Users,
  Download,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

interface RequestItem {
  _id: string
  title: string
  description: string
  targetDepartments: Array<{
    _id: string
    name: string
    description: string
  }>
  assignedDirectors: Array<{
    director?: {
      _id: string
      firstName: string
      lastName: string
      email: string
      avatar?: string
    }
    status: string
    _id: string
    actionComment?: string
    actionDate?: string
    signatureProvided?: boolean
  }>
  departmentApprovals?: Array<{
    department: {
      _id: string
      name: string
    }
    status: string
    approvedBy?: {
      _id: string
      firstName: string
      lastName: string
    }
    actionDate?: string
  }>
  priority: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
  createdBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
    avatar?: string
  }
  attachments: Array<{
    name: string
    size: number
    type: string
    url?: string
    cloudinaryId?: string
  }>
  requiresSignature?: boolean
  signatureProvided?: boolean
  signatureData?: string
  comments: Array<{
    _id: string
    author: {
      _id: string
      firstName: string
      lastName: string
      email: string
      avatar?: string
    }
    text: string
    isSignature?: boolean
    signatureData?: string
    createdAt: string
    updatedAt: string
  }>
  actionHistory?: Array<{
    actionBy: {
      _id: string
      firstName: string
      lastName: string
      email: string
    }
    action: string
    comment?: string
    previousStatus?: string
    newStatus: string
    createdAt: string
  }>
  dueDate?: string
  isUrgent?: boolean
}

export default function RequestsPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    priority: "",
    category: "",
  })
  const [loadingRequestDetails, setLoadingRequestDetails] = useState(false)

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Get theme colors based on user role
  const getThemeColor = () => {
    switch (authContext.user?.role) {
      case "admin":
        return {
          primary: "bg-gradient-to-r from-orange-500 to-orange-600",
          primaryHover: "hover:from-orange-600 hover:to-orange-700",
          bg: "bg-orange-50",
          text: "text-orange-600",
          badge: "bg-orange-100 text-orange-800 border-orange-200",
          badgeSecondary: "bg-orange-50 text-orange-700 border-orange-300",
          border: "border-orange-200",
          accent: "bg-orange-500",
          card: "border-orange-100",
          button: "bg-orange-500 hover:bg-orange-600 text-white",
          buttonOutline: "border-orange-500 text-orange-600 hover:bg-orange-50",
          focus: "focus:ring-orange-500 focus:border-orange-500",
          gradient: "from-orange-100 to-amber-100",
          iconBg: "bg-gradient-to-br from-orange-100 to-amber-100",
          iconColor: "text-orange-600",
        }
      case "director":
        return {
          primary: "bg-gradient-to-r from-red-500 to-red-600",
          primaryHover: "hover:from-red-600 hover:to-red-700",
          bg: "bg-red-50",
          text: "text-red-600",
          badge: "bg-red-100 text-red-800 border-red-200",
          badgeSecondary: "bg-red-50 text-red-700 border-red-300",
          border: "border-red-200",
          accent: "bg-red-500",
          card: "border-red-100",
          button: "bg-red-500 hover:bg-red-600 text-white",
          buttonOutline: "border-red-500 text-red-600 hover:bg-red-50",
          focus: "focus:ring-red-500 focus:border-red-500",
          gradient: "from-red-100 to-rose-100",
          iconBg: "bg-gradient-to-br from-red-100 to-rose-100",
          iconColor: "text-red-600",
        }
      case "department":
        return {
          primary: "bg-gradient-to-r from-green-500 to-green-600",
          primaryHover: "hover:from-green-600 hover:to-green-700",
          bg: "bg-green-50",
          text: "text-green-600",
          badge: "bg-green-100 text-green-800 border-green-200",
          badgeSecondary: "bg-green-50 text-green-700 border-green-300",
          border: "border-green-200",
          accent: "bg-green-500",
          card: "border-green-100",
          button: "bg-green-500 hover:bg-green-600 text-white",
          buttonOutline: "border-green-500 text-green-600 hover:bg-green-50",
          focus: "focus:ring-green-500 focus:border-green-500",
          gradient: "from-green-100 to-emerald-100",
          iconBg: "bg-gradient-to-br from-green-100 to-emerald-100",
          iconColor: "text-green-600",
        }
      default:
        return {
          primary: "bg-gradient-to-r from-blue-500 to-blue-600",
          primaryHover: "hover:from-blue-600 hover:to-blue-700",
          bg: "bg-blue-50",
          text: "text-blue-600",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
          badgeSecondary: "bg-blue-50 text-blue-700 border-blue-300",
          border: "border-blue-200",
          accent: "bg-blue-500",
          card: "border-blue-100",
          button: "bg-blue-500 hover:bg-blue-600 text-white",
          buttonOutline: "border-blue-500 text-blue-600 hover:bg-blue-50",
          focus: "focus:ring-blue-500 focus:border-blue-500",
          gradient: "from-blue-100 to-indigo-100",
          iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100",
          iconColor: "text-blue-600",
        }
    }
  }

  const themeColors = getThemeColor()

  // Fetch requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        const response = await api.getRequests(authContext)
        if (response.success && response.data) {
          setRequests(response.data.requests || [])
        } else {
          throw new Error(response.error || "Failed to fetch requests")
        }
      } catch (error: any) {
        console.error("Error fetching requests:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load requests",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [authContext, toast])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200"
      case "pending":
        return "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200"
      case "rejected":
        return "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200"
      case "need signature":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200"
      case "sent back":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200"
      case "in review":
        return "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200"
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200"
      case "high":
        return "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200"
      case "medium":
        return "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200"
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      relative: getRelativeTime(date),
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.targetDepartments.some((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      request.assignedDirectors.some((ad) => {
        if (ad.director) {
          return `${ad.director.firstName} ${ad.director.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        }
        return false
      })

    const matchesStatus = filterStatus === "all" || request.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (requestId: string) => {
    try {
      const response = await api.deleteRequest(requestId, authContext)
      if (response.success) {
        setRequests((prev) => prev.filter((request) => request._id !== requestId))
        setIsDeleteDialogOpen(false)
        setSelectedRequest(null)
        toast({
          title: "Request deleted",
          description: "Request has been successfully deleted",
        })
      } else {
        throw new Error(response.error || "Failed to delete request")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete request",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedRequest) return
    try {
      const response = await api.updateRequest(selectedRequest._id, editFormData, authContext)
      if (response.success) {
        setRequests((prev) =>
          prev.map((request) => (request._id === selectedRequest._id ? { ...request, ...editFormData } : request)),
        )
        setIsEditDialogOpen(false)
        setSelectedRequest(null)
        toast({
          title: "Request updated",
          description: "Request has been successfully updated",
        })
      } else {
        throw new Error(response.error || "Failed to update request")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      })
    }
  }

  const openViewDialog = async (request: RequestItem) => {
    try {
      setLoadingRequestDetails(true)
      const response = await api.getRequest(request._id, authContext)
      if (response.success && response.data) {
        setSelectedRequest(response.data.request)
      } else {
        setSelectedRequest(request)
      }
      setIsViewDialogOpen(true)
    } catch (error: any) {
      console.error("Error fetching request details:", error)
      setSelectedRequest(request)
      setIsViewDialogOpen(true)
    } finally {
      setLoadingRequestDetails(false)
    }
  }

  const openEditDialog = (request: RequestItem) => {
    setSelectedRequest(request)
    setEditFormData({
      title: request.title,
      description: request.description,
      priority: request.priority,
      category: request.category,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (request: RequestItem) => {
    setSelectedRequest(request)
    setIsDeleteDialogOpen(true)
  }

  const getStatusCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status.toLowerCase() === "pending").length,
      approved: requests.filter((r) => r.status.toLowerCase() === "approved").length,
      rejected: requests.filter((r) => r.status.toLowerCase() === "rejected").length,
      "need signature": requests.filter((r) => r.status.toLowerCase() === "need signature").length,
      "sent back": requests.filter((r) => r.status.toLowerCase() === "sent back").length,
      "in review": requests.filter((r) => r.status.toLowerCase() === "in review").length,
    }
  }

  const statusCounts = getStatusCounts()

  const RequestCard = ({ request }: { request: RequestItem }) => (
    <Card className="hover:shadow-2xl transition-all duration-300 h-fit bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg relative overflow-hidden group">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${themeColors.gradient} rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform translate-x-16 -translate-y-16`}
      ></div>
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${themeColors.iconBg} flex-shrink-0 shadow-md`}>
                <MessageSquare className={`w-4 h-4 sm:w-6 sm:h-6 ${themeColors.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 line-clamp-2 mb-2">{request.title}</h3>
                <p className="text-slate-600 text-sm sm:text-base line-clamp-3 leading-relaxed">
                  {request.description}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0 hover:shadow-lg transition-shadow border-2 bg-transparent h-8 w-8 sm:h-10 sm:w-10"
                >
                  <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => openViewDialog(request)} className="text-sm sm:text-base py-2 sm:py-3">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  View Details
                </DropdownMenuItem>
                {(request.status.toLowerCase() === "pending" || request.status.toLowerCase() === "sent back") && (
                  <DropdownMenuItem
                    onClick={() => openEditDialog(request)}
                    className="text-sm sm:text-base py-2 sm:py-3"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    Edit Request
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-600 text-sm sm:text-base py-2 sm:py-3"
                  onClick={() => openDeleteDialog(request)}
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">{formatDateTime(request.createdAt).relative}</span>
              <span className="text-xs sm:text-sm text-slate-500">({formatDateTime(request.createdAt).date})</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600">
              <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base truncate">
                {request.createdBy.firstName} {request.createdBy.lastName}
              </span>
            </div>
            {request.assignedDirectors.length > 0 && request.assignedDirectors[0].director && (
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base truncate">
                  Director: {request.assignedDirectors[0].director.firstName}{" "}
                  {request.assignedDirectors[0].director.lastName}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">
                {request.targetDepartments.length} department{request.targetDepartments.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Badge
              className={`${getStatusColor(request.status)} border text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium shadow-sm`}
            >
              {request.status}
            </Badge>
            <Badge
              className={`${getPriorityColor(request.priority)} border text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium shadow-sm`}
            >
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
            </Badge>
            <Badge className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium shadow-sm">
              {request.category}
            </Badge>
            {request.signatureProvided && (
              <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium shadow-sm">
                <PenTool className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Signed
              </Badge>
            )}
            {request.isUrgent && (
              <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium shadow-sm animate-pulse">
                🚨 Urgent
              </Badge>
            )}
          </div>

          {request.attachments && request.attachments.length > 0 && (
            <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600 bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium">{request.attachments.length} attachment(s)</span>
            </div>
          )}

          {request.status === "Need Signature" && (
            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border border-blue-200">
              <div className="flex items-center space-x-2 sm:space-x-3 text-blue-800">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold">Action Required</span>
              </div>
            </div>
          )}

          {request.dueDate && (
            <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600 bg-amber-50 p-2 sm:p-3 rounded-lg border border-amber-200">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">Due: {new Date(request.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const RequestTable = () => (
    <div className="border-0 rounded-2xl overflow-hidden shadow-xl bg-white overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
          <tr>
            <th className="text-left p-3 sm:p-6 font-semibold text-slate-700 text-sm sm:text-lg">Title</th>
            <th className="text-left p-3 sm:p-6 font-semibold text-slate-700 text-sm sm:text-lg">Status</th>
            <th className="text-left p-3 sm:p-6 font-semibold text-slate-700 text-sm sm:text-lg">Priority</th>
            <th className="text-left p-3 sm:p-6 font-semibold text-slate-700 text-sm sm:text-lg">Category</th>
            <th className="text-left p-3 sm:p-6 font-semibold text-slate-700 text-sm sm:text-lg">Created</th>
            <th className="text-left p-3 sm:p-6 font-semibold text-slate-700 text-sm sm:text-lg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((request, index) => (
            <tr
              key={request._id}
              className={`${index % 2 === 0 ? "bg-white" : "bg-slate-25"} hover:bg-slate-50 transition-colors`}
            >
              <td className="p-3 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${themeColors.iconBg}`}>
                    <MessageSquare className={`w-4 h-4 sm:w-5 sm:h-5 ${themeColors.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm sm:text-lg truncate">{request.title}</p>
                    <p className="text-slate-600 truncate max-w-xs text-xs sm:text-sm">{request.description}</p>
                    {request.isUrgent && <Badge className="bg-red-100 text-red-800 text-xs mt-1">🚨 Urgent</Badge>}
                  </div>
                </div>
              </td>
              <td className="p-3 sm:p-6">
                <div className="flex flex-col space-y-1">
                  <Badge
                    className={`${getStatusColor(request.status)} border text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium w-fit`}
                  >
                    {request.status}
                  </Badge>
                  {request.signatureProvided && (
                    <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 text-xs px-2 py-1 w-fit">
                      <PenTool className="w-3 h-3 mr-1" />
                      Signed
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-3 sm:p-6">
                <Badge
                  className={`${getPriorityColor(request.priority)} border text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium`}
                >
                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                </Badge>
              </td>
              <td className="p-3 sm:p-6">
                <Badge className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium">
                  {request.category}
                </Badge>
              </td>
              <td className="p-3 sm:p-6">
                <div className="text-slate-600 text-xs sm:text-base">
                  <div>{formatDateTime(request.createdAt).relative}</div>
                  <div className="text-xs text-slate-500">{formatDateTime(request.createdAt).date}</div>
                </div>
              </td>
              <td className="p-3 sm:p-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:shadow-lg transition-shadow h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => openViewDialog(request)}
                      className="text-sm sm:text-base py-2 sm:py-3"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      View Details
                    </DropdownMenuItem>
                    {(request.status.toLowerCase() === "pending" || request.status.toLowerCase() === "sent back") && (
                      <DropdownMenuItem
                        onClick={() => openEditDialog(request)}
                        className="text-sm sm:text-base py-2 sm:py-3"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                        Edit Request
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600 text-sm sm:text-base py-2 sm:py-3"
                      onClick={() => openDeleteDialog(request)}
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${themeColors.iconColor}`} />
            <div
              className={`absolute inset-0 h-12 w-12 mx-auto rounded-full ${themeColors.primary} opacity-20 animate-pulse`}
            ></div>
          </div>
          <span className="text-slate-600 text-lg sm:text-xl">Loading requests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div
        className={`absolute top-20 left-10 w-20 h-20 bg-gradient-to-br ${themeColors.gradient} rounded-full opacity-10 animate-float`}
      ></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-10 animate-float-delayed"></div>
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full opacity-10 animate-float"></div>

      <div className="relative z-10 space-y-6 sm:space-y-8 px-4 sm:px-6 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${themeColors.primary} shadow-xl`}>
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                  My Requests
                </h1>
                <p className="text-slate-600 text-base sm:text-lg lg:text-xl mt-1 sm:mt-2">
                  Track and manage your submitted requests
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 border-2 border-slate-200 rounded-xl sm:rounded-2xl p-1 sm:p-2 bg-white shadow-lg">
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("card")}
                className={viewMode === "card" ? `${themeColors.primary} text-white shadow-lg` : ""}
              >
                <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="ml-1 sm:ml-2 hidden sm:inline">Cards</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? `${themeColors.primary} text-white shadow-lg` : ""}
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="ml-1 sm:ml-2 hidden sm:inline">List</span>
              </Button>
            </div>
            <Link href="/dashboard/requests/create">
              <Button
                className={`${themeColors.primary} ${themeColors.primaryHover} text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-sm sm:text-lg px-4 sm:px-8 py-2 sm:py-4 w-full sm:w-auto`}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                Create Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-xs sm:text-sm font-medium">Total Requests</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-800">{statusCounts.all}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-xl sm:rounded-2xl">
                  <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 text-xs sm:text-sm font-medium">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-800">{statusCounts.pending}</p>
                </div>
                <div className="p-2 sm:p-3 bg-amber-100 rounded-xl sm:rounded-2xl">
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 text-xs sm:text-sm font-medium">Approved</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-800">{statusCounts.approved}</p>
                </div>
                <div className="p-2 sm:p-3 bg-emerald-100 rounded-xl sm:rounded-2xl">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-xs sm:text-sm font-medium">Rejected</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-800">{statusCounts.rejected}</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-100 rounded-xl sm:rounded-2xl">
                  <XCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-slate-50">
          <CardContent className="p-4 sm:p-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
              <Input
                placeholder="Search requests by title, department, or director..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 sm:pl-14 h-12 sm:h-14 text-base sm:text-lg border-2 border-slate-200 rounded-xl sm:rounded-2xl bg-white shadow-inner ${themeColors.focus}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-12 sm:h-16 p-1 sm:p-2 bg-white shadow-xl rounded-xl sm:rounded-2xl border-0 min-w-[600px] sm:min-w-0">
              <TabsTrigger
                value="all"
                className={`text-xs sm:text-base py-2 sm:py-3 data-[state=active]:${themeColors.primary} data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg sm:rounded-xl`}
              >
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="text-xs sm:text-base py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg sm:rounded-xl"
              >
                Pending ({statusCounts.pending})
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="text-xs sm:text-base py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg sm:rounded-xl"
              >
                Approved ({statusCounts.approved})
              </TabsTrigger>
              <TabsTrigger
                value="need signature"
                className="text-xs sm:text-base py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg sm:rounded-xl"
              >
                <span className="hidden sm:inline">Need Signature</span>
                <span className="sm:hidden">Signature</span> ({statusCounts["need signature"]})
              </TabsTrigger>
              <TabsTrigger
                value="sent back"
                className="text-xs sm:text-base py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg sm:rounded-xl"
              >
                <span className="hidden sm:inline">Sent Back</span>
                <span className="sm:hidden">Sent</span> ({statusCounts["sent back"]})
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="text-xs sm:text-base py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg sm:rounded-xl"
              >
                Rejected ({statusCounts.rejected})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filterStatus} className="space-y-4 sm:space-y-6">
            {filteredRequests.length === 0 ? (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
                <CardContent className="p-8 sm:p-16 text-center">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-100 to-gray-100 rounded-full w-fit mx-auto">
                      <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-800">No requests found</h3>
                      <p className="text-slate-600 text-base sm:text-lg max-w-md mx-auto">
                        {searchTerm || filterStatus !== "all"
                          ? "Try adjusting your search or filter criteria"
                          : "You haven't created any requests yet"}
                      </p>
                    </div>
                    <Link href="/dashboard/requests/create">
                      <Button
                        className={`${themeColors.primary} ${themeColors.primaryHover} text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4`}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                        Create Your First Request
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filteredRequests.map((request) => (
                  <RequestCard key={request._id} request={request} />
                ))}
              </div>
            ) : (
              <RequestTable />
            )}
          </TabsContent>
        </Tabs>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
            <DialogHeader className="pb-4 sm:pb-6">
              <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xl sm:text-2xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-2 ${themeColors.iconBg} rounded-xl`}>
                    <MessageSquare className={`w-5 h-5 sm:w-6 sm:h-6 ${themeColors.iconColor}`} />
                  </div>
                  <span className="break-words">Request Details</span>
                </div>
                {selectedRequest?.signatureProvided && (
                  <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 w-fit">
                    <PenTool className="w-4 h-4 mr-1" />
                    Signed
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-base sm:text-lg">
                Complete information about this request
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6 sm:space-y-8">
                {/* Request Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl sm:rounded-2xl">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Title</Label>
                    <p className="text-slate-800 font-semibold text-base sm:text-lg break-words">
                      {selectedRequest.title}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Category</Label>
                    <p className="text-slate-800 capitalize text-base sm:text-lg font-semibold">
                      {selectedRequest.category}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Priority</Label>
                    <Badge
                      className={`${getPriorityColor(selectedRequest.priority)} border text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2`}
                    >
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Status</Label>
                    <Badge
                      className={`${getStatusColor(selectedRequest.status)} border text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2`}
                    >
                      {selectedRequest.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Created</Label>
                    <p className="text-slate-800 font-medium text-sm sm:text-base">
                      {formatDateTime(selectedRequest.createdAt).date} at{" "}
                      {formatDateTime(selectedRequest.createdAt).time}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Last Updated</Label>
                    <p className="text-slate-800 font-medium text-sm sm:text-base">
                      {formatDateTime(selectedRequest.updatedAt).date} at{" "}
                      {formatDateTime(selectedRequest.updatedAt).time}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-slate-800">Description</Label>
                  <div className="p-4 sm:p-6 bg-slate-50 rounded-xl border">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                      {selectedRequest.description}
                    </p>
                  </div>
                </div>

                {/* Target Departments */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-slate-800">Target Departments</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedRequest.targetDepartments.map((dept) => (
                      <div key={dept._id} className="p-3 sm:p-4 bg-slate-50 rounded-xl border">
                        <div className="flex items-center space-x-2">
                          <Building2 className={`w-4 h-4 sm:w-5 sm:h-5 ${themeColors.iconColor}`} />
                          <span className="font-medium text-slate-800 text-sm sm:text-base">{dept.name}</span>
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm mt-1">{dept.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned Directors */}
                {selectedRequest.assignedDirectors.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-slate-800">Assigned Directors</Label>
                    <div className="space-y-3">
                      {selectedRequest.assignedDirectors.map((assignment) => (
                        <div key={assignment._id} className="p-3 sm:p-4 bg-slate-50 rounded-xl border">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center space-x-3">
                              <User className={`w-4 h-4 sm:w-5 sm:h-5 ${themeColors.iconColor}`} />
                              <div>
                                <p className="font-medium text-slate-800 text-sm sm:text-base">
                                  {assignment.director
                                    ? `${assignment.director.firstName} ${assignment.director.lastName}`
                                    : "Director not assigned"}
                                </p>
                                {assignment.director && (
                                  <p className="text-slate-600 text-xs sm:text-sm">{assignment.director.email}</p>
                                )}
                              </div>
                            </div>
                            <Badge
                              className={`${getStatusColor(assignment.status)} border text-xs sm:text-sm px-2 sm:px-3 py-1`}
                            >
                              {assignment.status}
                            </Badge>
                          </div>
                          {assignment.actionComment && (
                            <p className="text-slate-600 text-xs sm:text-sm mt-2 italic">
                              "{assignment.actionComment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-slate-800">Attachments</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedRequest.attachments.map((attachment, index) => (
                        <div key={index} className="p-3 sm:p-4 bg-slate-50 rounded-xl border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-800 text-sm sm:text-base truncate">
                                  {attachment.name}
                                </p>
                                <p className="text-slate-600 text-xs sm:text-sm">{formatFileSize(attachment.size)}</p>
                              </div>
                            </div>
                            {attachment.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachment.url, "_blank")}
                                className="flex-shrink-0"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedRequest.comments && selectedRequest.comments.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-slate-800">Comments & Activity</Label>
                    <div className="space-y-3">
                      {selectedRequest.comments.map((comment) => (
                        <div key={comment._id} className="p-3 sm:p-4 bg-slate-50 rounded-xl border">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                <p className="font-medium text-slate-800 text-sm sm:text-base">
                                  {comment.author.firstName} {comment.author.lastName}
                                </p>
                                <p className="text-slate-500 text-xs sm:text-sm">
                                  {formatDateTime(comment.createdAt).relative}
                                </p>
                              </div>
                              <p className="text-slate-700 text-sm sm:text-base mt-1 break-words">{comment.text}</p>
                              {comment.isSignature && (
                                <Badge className="bg-emerald-100 text-emerald-800 text-xs mt-2">
                                  <PenTool className="w-3 h-3 mr-1" />
                                  Digital Signature
                                </Badge>

                              )}
                              {comment.signatureData && (
                                <div className="mt-2">
                                  <img
                                    src={comment.signatureData}
                                    alt="Digital Signature"
                                    className="w-24 h-12 object-contain border border-emerald-200 rounded-md"
                                    title={`${comment.author.firstName} ${comment.author.lastName} - ${formatDateTime(comment.createdAt).relative}`}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action History */}
                {selectedRequest.actionHistory && selectedRequest.actionHistory.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-slate-800">Action History</Label>
                    <div className="space-y-2">
                      {selectedRequest.actionHistory.map((action, index) => (
                        <div key={index} className="p-3 sm:p-4 bg-slate-50 rounded-xl border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <ArrowRight className={`w-4 h-4 ${themeColors.iconColor}`} />
                              <div>
                                <p className="font-medium text-slate-800 text-sm sm:text-base">
                                  {action.actionBy.firstName} {action.actionBy.lastName}
                                </p>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                  {action.action.replace("_", " ")} - {action.comment}
                                </p>
                              </div>
                            </div>
                            <p className="text-slate-500 text-xs sm:text-sm">
                              {formatDateTime(action.createdAt).relative}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 sm:pb-6">
              <DialogTitle className="flex items-center space-x-3 text-xl sm:text-2xl">
                <div className={`p-2 ${themeColors.iconBg} rounded-xl`}>
                  <Edit className={`w-5 h-5 sm:w-6 sm:h-6 ${themeColors.iconColor}`} />
                </div>
                <span>Edit Request</span>
              </DialogTitle>
              <DialogDescription className="text-base sm:text-lg">
                Make changes to your request details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-sm font-medium">
                  Title
                </Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className={`${themeColors.focus} transition-colors`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                  className={`${themeColors.focus} transition-colors resize-none`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority" className="text-sm font-medium">
                    Priority
                  </Label>
                  <Select
                    value={editFormData.priority}
                    onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}
                  >
                    <SelectTrigger className={`${themeColors.focus}`}>
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
                <div className="space-y-2">
                  <Label htmlFor="edit-category" className="text-sm font-medium">
                    Category
                  </Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                  >
                    <SelectTrigger className={`${themeColors.focus}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approval">Approval</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleEdit}
                  className={`${themeColors.primary} ${themeColors.primaryHover} text-white flex-1`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Request
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md border-0 shadow-2xl">
            <DialogHeader className="pb-4 sm:pb-6">
              <DialogTitle className="flex items-center space-x-3 text-xl sm:text-2xl text-red-600">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <span>Delete Request</span>
              </DialogTitle>
              <DialogDescription className="text-base sm:text-lg">
                Are you sure you want to delete this request? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => selectedRequest && handleDelete(selectedRequest._id)}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Request
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
