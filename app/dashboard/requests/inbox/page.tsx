"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Inbox,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  User,
  Calendar,
  Building2,
  PenTool,
  Loader2,
  Search,
  Grid3X3,
  List,
  FileText,
  Paperclip,
  MoreHorizontal,
  Clock,
  Users,
  Star,
  Zap,
  Settings,
  AlertTriangle,
} from "lucide-react"
import { redirect } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ReceivedRequest {
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
    signatureProvided?: boolean
    signatureData?: string
    _id: string
  }>
  departmentApprovals: Array<{
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
    uploadedBy?: string
    uploadedAt?: string
    _id: string
  }>
  requiresSignature?: boolean
  signatureProvided?: boolean
  signatureData?: string
  dueDate?: string
  isUrgent?: boolean
  comments: Array<{
    _id: string
    author: {
      _id: string
      firstName: string
      lastName: string
      email: string
    }
    text: string
    isSignature?: boolean
    signatureData?: string
    createdAt: string
  }>
  actionHistory: Array<{
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
  canTakeAction?: boolean
  needsMyAction?: boolean
  needsMySignature?: boolean
}

export default function RequestInboxPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [receivedRequests, setReceivedRequests] = useState<ReceivedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ReceivedRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ReceivedRequest | null>(null)
  const [actionComment, setActionComment] = useState("")
  const [requireSignature, setRequireSignature] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [searchTerm, setSearchTerm] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [signatureData, setSignatureData] = useState("")
  const [isDrawing, setIsDrawing] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [userSignature, setUserSignature] = useState<boolean | null>(null)



  // Check user signature when opening signature dialog
  useEffect(() => {
    if (isSignatureDialogOpen) {
      const checkUserSignature = async () => {
        try {
          const response = await api.getUserSignature(authContext)
          if (response.success && response.data?.signature) {
            setUserSignature(true)
            setSignatureData(response.data.signature.data)
          } else {
            setUserSignature(false)
          }
        } catch (error) {
          console.error('Error checking user signature:', error)
          setUserSignature(false)
        }
      }
      checkUserSignature()
    } else {
      setUserSignature(null)
      setSignatureData('')
    }
  }, [isSignatureDialogOpen, authContext])


  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Helper function to determine if user can sign this request
  const canUserSign = (request: ReceivedRequest): boolean => {
    // Check explicit flag from backend first
    if (request.needsMySignature) return true

    // Additional client-side checks
    if (!request.requiresSignature) return false

    const userRole = authContext.user?.role
    const userDepartmentId = authContext.user?.department || authContext.user?.departmentId

    // Admin can sign any request that requires signature
    if (userRole === "admin") {
      return !request.signatureProvided
    }

    // Directors can sign if they are assigned to this request
    if (userRole === "director") {
      const assignment = request.assignedDirectors.find(
        (assignment) => assignment.director?._id === authContext.user?.id,
      )
      return assignment && !assignment.signatureProvided
    }

    // Department users can sign if their department is targeted and signature not provided
    if (userRole === "department") {
      const isDepartmentTarget = request.targetDepartments.some((dept) => dept._id === userDepartmentId)
      return isDepartmentTarget && !request.signatureProvided
    }

    return false
  }

  // Helper function to determine if user can take action on this request
  const canUserTakeAction = (request: ReceivedRequest): boolean => {
    // Check explicit flag from backend first
    if (request.canTakeAction !== undefined) return request.canTakeAction

    // Additional client-side checks
    const userRole = authContext.user?.role
    const userDepartmentId = authContext.user?.department || authContext.user?.departmentId
    const requestStatus = request.status.toLowerCase()

    // Cannot take action on final states
    if (["approved", "rejected", "completed"].includes(requestStatus)) {
      return false
    }

    // Admin can take action on most requests
    if (userRole === "admin") {
      return true
    }

    // Directors can take action on requests assigned to them or targeting their department
    if (userRole === "director") {
      const isAssigned = request.assignedDirectors.some(
        (assignment) =>
          assignment.director?._id === authContext.user?.id && assignment.status.toLowerCase() === "pending",
      )
      const isDepartmentTarget = request.targetDepartments.some((dept) => dept._id === userDepartmentId)
      return isAssigned || isDepartmentTarget
    }

    // Department users can take action on requests targeting their department
    if (userRole === "department") {
      const isDepartmentTarget = request.targetDepartments.some((dept) => dept._id === userDepartmentId)

      if (!isDepartmentTarget) return false

      // Check if this department has already taken action
      const departmentApproval = request.departmentApprovals.find(
        (approval) => approval.department._id === userDepartmentId,
      )

      return !departmentApproval || departmentApproval.status.toLowerCase() === "pending"
    }

    return false
  }

  // Helper function to check if request needs signature (for filtering)
  const requestNeedsSignature = (request: ReceivedRequest): boolean => {
    return request.requiresSignature === true && !request.signatureProvided
  }

  // Helper function to check if request is actionable (for filtering)
  const requestIsActionable = (request: ReceivedRequest): boolean => {
    const requestStatus = request.status.toLowerCase()
    return !["approved", "rejected", "completed"].includes(requestStatus)
  }

  // Helper function to show signature option in dropdown (always show if request requires signature)
  const shouldShowSignatureOption = (request: ReceivedRequest): boolean => {
    return request.requiresSignature === true
  }

  // Helper function to show action option in dropdown (always show if request is actionable)
  const shouldShowActionOption = (request: ReceivedRequest): boolean => {
    const requestStatus = request.status.toLowerCase()
    return !["approved", "rejected", "completed"].includes(requestStatus)
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

  // Fetch received requests
  useEffect(() => {
    const fetchReceivedRequests = async () => {
      try {
        setLoading(true)
        const response = await api.getIncomingRequests(authContext)
        if (response.success && response.data) {
          console.log("Fetched requests:", response.data.requests) // Debug log
          setReceivedRequests(response.data.requests || [])
        } else {
          throw new Error(response.error || "Failed to fetch requests")
        }
      } catch (error: any) {
        console.error("Error fetching received requests:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load requests",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchReceivedRequests()
  }, [authContext, toast])

  // Filter requests based on search term and status
  useEffect(() => {
    let filtered = receivedRequests.filter(
      (request) =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.createdBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.createdBy.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.targetDepartments.some((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (filterStatus !== "all") {
      if (filterStatus === "urgent") {
        filtered = filtered.filter((request) => request.isUrgent || request.priority.toLowerCase() === "urgent")
      } else if (filterStatus === "signature") {
        filtered = filtered.filter((request) => requestNeedsSignature(request))
      } else if (filterStatus === "actionable") {
        filtered = filtered.filter((request) => requestIsActionable(request))
      }
    }

    setFilteredRequests(filtered)
  }, [receivedRequests, searchTerm, filterStatus, authContext.user])

  const handleRequestAction = async (action: "approve" | "reject" | "sendback") => {
    if (!selectedRequest) return

    // Check if user can actually take action
    // if (!canUserTakeAction(selectedRequest)) {
    //   toast({
    //     title: "Action not allowed",
    //     description: "You don't have permission to take action on this request",
    //     variant: "destructive",
    //   })
    //   return
    // }

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
        requireSignature: requireSignature,
      }

      const response = await api.takeRequestAction(selectedRequest._id, actionData, authContext)
      if (response.success) {
        // Remove the request from the list or update its status
        setReceivedRequests((prev) => prev.filter((req) => req._id !== selectedRequest._id))
        setSelectedRequest(null)
        setActionComment("")
        setRequireSignature(false)
        setIsActionDialogOpen(false)
        toast({
          title: `Request ${action}d successfully`,
          description: `${selectedRequest.title} has been ${action}d`,
        })
      } else {
        throw new Error(response.error || `Failed to ${action} request`)
      }
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message || `Failed to ${action} request`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSignatureSubmission = async () => {
    if (!selectedRequest || !signatureData) {
      toast({
        title: "Signature required",
        description: "Please provide your signature",
        variant: "destructive",
      })
      return
    }

    // Check if user can actually sign
    // if (!canUserSign(selectedRequest)) {
    //   toast({
    //     title: "Signature not allowed",
    //     description: "You don't have permission to sign this request",
    //     variant: "destructive",
    //   })
    //   return
    // }

    setIsProcessing(true)
    try {
      const response = await api.submitSignature(selectedRequest._id, { signatureData }, authContext)
      if (response.success) {
        // Update the request in the list
        setReceivedRequests((prev) =>
          prev.map((req) =>
            req._id === selectedRequest._id
              ? { ...req, signatureProvided: true, signatureData, needsMySignature: false }
              : req,
          ),
        )
        setSelectedRequest(null)
        setSignatureData("")
        setIsSignatureDialogOpen(false)
        toast({
          title: "Signature submitted successfully",
          description: `Your signature has been added to ${selectedRequest.title}`,
        })
      } else {
        throw new Error(response.error || "Failed to submit signature")
      }
    } catch (error: any) {
      toast({
        title: "Signature submission failed",
        description: error.message || "Failed to submit signature",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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

  const getActionColor = (action: string) => {
    switch (action) {
      case "approve":
        return "bg-emerald-500 hover:bg-emerald-600"
      case "reject":
        return "bg-red-500 hover:bg-red-600"
      case "sendback":
        return "bg-orange-500 hover:bg-orange-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const openViewDialog = (request: ReceivedRequest) => {
    setSelectedRequest(request)
    setIsViewDialogOpen(true)
  }

  const openSignatureDialog = (request: ReceivedRequest) => {
    setSelectedRequest(request)
    setSignatureData("")
    setIsSignatureDialogOpen(true)
  }

  const openActionDialog = (request: ReceivedRequest) => {
    setSelectedRequest(request)
    setActionComment("")
    setRequireSignature(false)
    setIsActionDialogOpen(true)
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    setSignatureData("")
  }

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current
    if (canvas) {
      const dataURL = canvas.toDataURL()
      setSignatureData(dataURL)
      toast({
        title: "Signature captured",
        description: "Your signature has been captured successfully",
      })
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = signatureCanvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = signatureCanvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const getStatusCounts = () => {
    return {
      all: receivedRequests.length,
      urgent: receivedRequests.filter((r) => r.isUrgent || r.priority.toLowerCase() === "urgent").length,
      signature: receivedRequests.filter((r) => requestNeedsSignature(r)).length,
      actionable: receivedRequests.filter((r) => requestIsActionable(r)).length,
    }
  }

  const statusCounts = getStatusCounts()

  const RequestCard = ({ request }: { request: ReceivedRequest }) => {
    const userCanSign = canUserSign(request)
    const userCanTakeAction = canUserTakeAction(request)
    const showSignatureOption = shouldShowSignatureOption(request)
    const showActionOption = shouldShowActionOption(request)

    return (
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
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 line-clamp-2 flex-1">{request.title}</h3>
                    {request.isUrgent && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 animate-pulse flex-shrink-0">
                        <Zap className="w-3 h-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base line-clamp-3 leading-relaxed mb-3">
                    {request.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base truncate">
                        From: {request.createdBy.firstName} {request.createdBy.lastName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{formatDateTime(request.createdAt).relative}</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        {request.targetDepartments.length} department{request.targetDepartments.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
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
                  <DropdownMenuItem
                    onClick={() => openViewDialog(request)}
                    className="text-sm sm:text-base py-2 sm:py-3"
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    View Details
                  </DropdownMenuItem>
                  {showSignatureOption && (
                    <DropdownMenuItem
                      onClick={() => openSignatureDialog(request)}
                      className="text-sm sm:text-base py-2 sm:py-3"
                    >
                      <PenTool className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      Add Signature
                    </DropdownMenuItem>
                  )}
                  {showActionOption && (
                    <DropdownMenuItem
                      onClick={() => openActionDialog(request)}
                      className="text-sm sm:text-base py-2 sm:py-3"
                    >
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      Take Action
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
              {userCanSign && (
                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium shadow-sm animate-pulse">
                  <PenTool className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Needs My Signature
                </Badge>
              )}
              {userCanTakeAction && (
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 font-medium shadow-sm animate-pulse">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Action Required
                </Badge>
              )}
            </div>

            {request.attachments && request.attachments.length > 0 && (
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600 bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">{request.attachments.length} attachment(s)</span>
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
  }

  const RequestListItem = ({ request }: { request: ReceivedRequest }) => {
    const userCanSign = canUserSign(request)
    const userCanTakeAction = canUserTakeAction(request)
    const showSignatureOption = shouldShowSignatureOption(request)
    const showActionOption = shouldShowActionOption(request)

    return (
      <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-slate-50 transition-colors">
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
          <div className={`p-2 rounded-xl ${themeColors.iconBg}`}>
            <MessageSquare className={`w-4 h-4 ${themeColors.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
              <h3 className="font-medium text-slate-800 truncate text-sm sm:text-base">{request.title}</h3>
              <Badge className={`${getPriorityColor(request.priority)} text-xs px-2 py-1`}>
                {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
              </Badge>
              {request.isUrgent && (
                <Badge className="bg-red-100 text-red-800 text-xs px-2 py-1 animate-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  Urgent
                </Badge>
              )}
              {userCanSign && (
                <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 animate-pulse">
                  <PenTool className="w-3 h-3 mr-1" />
                  Signature
                </Badge>
              )}
              {userCanTakeAction && (
                <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 animate-pulse">
                  <Star className="w-3 h-3 mr-1" />
                  Action
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-slate-600">
              <span>
                From: {request.createdBy.firstName} {request.createdBy.lastName}
              </span>
              <span>{formatDateTime(request.createdAt).relative}</span>
              {request.attachments && request.attachments.length > 0 && (
                <span className="flex items-center">
                  <Paperclip className="w-3 h-3 mr-1" />
                  {request.attachments.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openViewDialog(request)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {showSignatureOption && (
              <DropdownMenuItem onClick={() => openSignatureDialog(request)}>
                <PenTool className="w-4 h-4 mr-2" />
                Add Signature
              </DropdownMenuItem>
            )}
            {showActionOption && (
              <DropdownMenuItem onClick={() => openActionDialog(request)}>
                <Settings className="w-4 h-4 mr-2" />
                Take Action
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

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

      <div className="relative z-10 space-y-6 sm:space-y-8 px-4 sm:px-6 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${themeColors.primary} shadow-xl`}>
                <Inbox className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                  Request Inbox
                </h1>
                <p className="text-slate-600 text-base sm:text-lg lg:text-xl mt-1 sm:mt-2">
                  Review and process incoming requests
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Badge
              variant="outline"
              className={`${themeColors.badge} text-sm sm:text-base px-3 sm:px-4 py-2 font-medium w-fit`}
            >
              {filteredRequests.length} Pending
            </Badge>
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
                  <Inbox className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-xs sm:text-sm font-medium">Urgent</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-800">{statusCounts.urgent}</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-100 rounded-xl sm:rounded-2xl">
                  <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-xs sm:text-sm font-medium">Need Signature</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-800">{statusCounts.signature}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-xl sm:rounded-2xl">
                  <PenTool className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-xs sm:text-sm font-medium">Actionable</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-800">{statusCounts.actionable}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-xl sm:rounded-2xl">
                  <Star className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-slate-50">
          <CardContent className="p-4 sm:p-8">
            <div className="space-y-4">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
                <Input
                  placeholder="Search requests by title, description, or submitter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 sm:pl-14 h-12 sm:h-14 text-base sm:text-lg border-2 border-slate-200 rounded-xl sm:rounded-2xl bg-white shadow-inner ${themeColors.focus}`}
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {[
                  { key: "all", label: "All", count: statusCounts.all },
                  { key: "urgent", label: "Urgent", count: statusCounts.urgent },
                  { key: "signature", label: "Need Signature", count: statusCounts.signature },
                  { key: "actionable", label: "Actionable", count: statusCounts.actionable },
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={filterStatus === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(filter.key)}
                    className={
                      filterStatus === filter.key
                        ? `${themeColors.primary} text-white shadow-lg`
                        : `${themeColors.buttonOutline}`
                    }
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Display */}
        {filteredRequests.length === 0 ? (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
            <CardContent className="p-8 sm:p-16 text-center">
              <div className="space-y-4 sm:space-y-6">
                <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-100 to-gray-100 rounded-full w-fit mx-auto">
                  <Inbox className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                    {searchTerm || filterStatus !== "all" ? "No matching requests" : "No pending requests"}
                  </h3>
                  <p className="text-slate-600 text-base sm:text-lg max-w-md mx-auto">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "All requests have been reviewed and processed"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              viewMode === "card"
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
                : "space-y-2 sm:space-y-4"
            }
          >
            {filteredRequests.map((request) =>
              viewMode === "card" ? (
                <RequestCard key={request._id} request={request} />
              ) : (
                <RequestListItem key={request._id} request={request} />
              ),
            )}
          </div>
        )}

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
                {selectedRequest?.isUrgent && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 animate-pulse w-fit">
                    <Zap className="w-4 h-4 mr-1" />
                    Urgent
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
                    <Label className="text-sm font-medium text-slate-600">Submitted By</Label>
                    <p className="text-slate-800 font-medium text-sm sm:text-base">
                      {selectedRequest.createdBy.firstName} {selectedRequest.createdBy.lastName}
                    </p>
                    <p className="text-slate-600 text-xs sm:text-sm">{selectedRequest.createdBy.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Created</Label>
                    <p className="text-slate-800 font-medium text-sm sm:text-base">
                      {formatDateTime(selectedRequest.createdAt).date} at{" "}
                      {formatDateTime(selectedRequest.createdAt).time}
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

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
                  {selectedRequest && shouldShowSignatureOption(selectedRequest) && (
                    <Button
                      onClick={() => openSignatureDialog(selectedRequest)}
                      className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Add Signature
                    </Button>
                  )}
                  {selectedRequest && shouldShowActionOption(selectedRequest) && (
                    <Button
                      onClick={() => openActionDialog(selectedRequest)}
                      className={`${themeColors.primary} ${themeColors.primaryHover} text-white shadow-lg`}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Signature Dialog */}
        <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
          <DialogContent className="max-w-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 sm:pb-6">
              <DialogTitle className="flex items-center space-x-3 text-xl sm:text-2xl">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <PenTool className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <span>Add Digital Signature</span>
              </DialogTitle>
              <DialogDescription className="text-base sm:text-lg">
                Please sign below to provide your signature for: {selectedRequest?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {!userSignature || !signatureData && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-yellow-700 mb-1">No Signature Found</p>
                      <p className="text-sm text-yellow-600">
                                     You need to upload your signature first. Please go to Settings > Profile to upload your signature.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Close the dialog and redirect to settings
                      setIsSignatureDialogOpen(false)
                      router.push('/dashboard/settings/signature')
                    }}
                    className="mt-3"
                  >
                    Go to Settings
                  </Button>
                </div>
              )}
              {/* {userSignature && (
                             <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
                               <Label className="text-sm font-medium text-slate-600 mb-3 block">Sign in the area below:</Label>
                               <canvas
                                 ref={signatureCanvasRef}
                                 width={500}
                                 height={200}
                                 className="border border-slate-300 rounded-lg bg-white cursor-crosshair w-full"
                                 onMouseDown={startDrawing}
                                 onMouseMove={draw}
                                 onMouseUp={stopDrawing}
                                 onMouseLeave={stopDrawing}
                               />
                             </div>
                           )} */}
              {signatureData && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <Label className="text-sm font-medium text-green-700 mb-2 block">Signature Preview:</Label>
                  <img
                    src={signatureData || "/placeholder.svg"}
                    alt="Signature Preview"
                    className="max-w-full h-16 border rounded"
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={clearSignature} className="flex-1 bg-transparent">
                  Clear Signature
                </Button>
                <Button onClick={saveSignature} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  <PenTool className="w-4 h-4 mr-2" />
                  Capture Signature
                </Button>
                <Button
                  onClick={handleSignatureSubmission}
                  disabled={!signatureData || isProcessing}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing ? "Submitting..." : "Submit Signature"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Action Dialog */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
            <DialogHeader className="pb-4 sm:pb-6">
              <DialogTitle className="flex items-center space-x-3 text-xl sm:text-2xl">
                <div className={`p-2 ${themeColors.iconBg} rounded-xl`}>
                  <Settings className={`w-5 h-5 sm:w-6 sm:h-6 ${themeColors.iconColor}`} />
                </div>
                <span>Take Action: {selectedRequest?.title}</span>
              </DialogTitle>
              <DialogDescription className="text-base sm:text-lg">
                Review and take action on this request submission
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 sm:space-y-8">
              {/* Request Summary */}
              <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl sm:rounded-2xl">
                <h4 className="font-semibold text-slate-800 mb-4 text-lg">Request Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-600">Category:</span>
                      <span className="ml-2 font-medium">{selectedRequest?.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Priority:</span>
                      <Badge className={`ml-2 ${getPriorityColor(selectedRequest?.priority || "")} text-xs px-2 py-1`}>
                        {selectedRequest?.priority}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-600">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedRequest?.status || "")} text-xs px-2 py-1`}>
                        {selectedRequest?.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-600">Submitted by:</span>
                      <span className="ml-2 font-medium">
                        {selectedRequest?.createdBy.firstName} {selectedRequest?.createdBy.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Created:</span>
                      <span className="ml-2 font-medium">
                        {selectedRequest && formatDateTime(selectedRequest.createdAt).date}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Departments:</span>
                      <span className="ml-2 font-medium">{selectedRequest?.targetDepartments.length}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <span className="text-slate-600">Description:</span>
                  <p className="mt-2 text-sm sm:text-base text-slate-800 bg-white p-3 rounded-lg border">
                    {selectedRequest?.description}
                  </p>
                </div>
              </div>

              {/* Comment Section */}
              <div className="space-y-3">
                <Label htmlFor="action-comment" className="text-lg font-semibold text-slate-800">
                  Response Comment
                </Label>
                <Textarea
                  id="action-comment"
                  placeholder="Add your response, feedback, or reason for this action..."
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  rows={4}
                  className={`${themeColors.focus} transition-colors resize-none`}
                />
              </div>

              {/* Additional Options */}
              <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
                <div className="space-y-1">
                  <Label htmlFor="require-signature" className="font-medium">
                    Require Additional Signature
                  </Label>
                  <p className="text-sm text-slate-600">Request additional signature before final approval</p>
                </div>
                <Switch
                  id="require-signature"
                  checked={requireSignature}
                  onCheckedChange={setRequireSignature}
                  className={`${themeColors.accent}`}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
                {[
                  { action: "approve", label: "Approve", icon: CheckCircle },
                  { action: "sendback", label: "Send Back", icon: RotateCcw },
                  { action: "reject", label: "Reject", icon: XCircle },
                ].map(({ action, label, icon: IconComponent }) => (
                  <Button
                    key={action}
                    onClick={() => handleRequestAction(action as any)}
                    disabled={isProcessing}
                    className={`${getActionColor(action)} text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <IconComponent className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing ? "Processing..." : label}
                  </Button>
                ))}
              </div>
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
