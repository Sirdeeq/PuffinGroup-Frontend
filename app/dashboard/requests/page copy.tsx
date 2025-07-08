"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  Download,
  FileText,
  Paperclip,
  CheckCircle,
  PenTool,
  Clock,
  Shield,
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
    director: {
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
  actionComment?: string
  actionDate?: string
  actionBy?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
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
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "need signature":
        return "bg-blue-100 text-blue-800"
      case "sent back":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-purple-100 text-purple-800"
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
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
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.targetDepartments.some((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      request.assignedDirectors.some((ad) =>
        `${ad.director.firstName} ${ad.director.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()),
      )
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
        setSelectedRequest(request) // fallback to current data
      }
      setIsViewDialogOpen(true)
    } catch (error: any) {
      console.error("Error fetching request details:", error)
      setSelectedRequest(request) // fallback to current data
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
    }
  }

  const statusCounts = getStatusCounts()

  const RequestCard = ({ request }: { request: RequestItem }) => (
    <Card className="hover:shadow-lg transition-shadow h-fit">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-full bg-orange-100 flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">{request.title}</h3>
                <p className="text-slate-600 mt-1 text-sm line-clamp-3">{request.description}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openViewDialog(request)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {request.status.toLowerCase() === "pending" && (
                  <DropdownMenuItem onClick={() => openEditDialog(request)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Request
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(request)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span>
                {request.createdBy.firstName} {request.createdBy.lastName}
              </span>
            </div>

            {request.assignedDirectors.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Building2 className="w-4 h-4" />
                <span>
                  Director: {request.assignedDirectors[0].director.firstName}{" "}
                  {request.assignedDirectors[0].director.lastName}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(request.status)} size="sm">
              {request.status}
            </Badge>
            <Badge className={getPriorityColor(request.priority)} size="sm">
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
            </Badge>
            <Badge variant="outline" size="sm">
              {request.category}
            </Badge>
            {request.signatureProvided && (
              <Badge className="bg-green-100 text-green-800" size="sm">
                <PenTool className="w-3 h-3 mr-1" />
                Signed
              </Badge>
            )}
          </div>

          {request.attachments && request.attachments.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Paperclip className="w-4 h-4" />
              <span>{request.attachments.length} attachment(s)</span>
            </div>
          )}

          {request.status === "Need Signature" && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Action Required</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const RequestTable = () => (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-4 font-medium text-slate-700">Title</th>
            <th className="text-left p-4 font-medium text-slate-700">Status</th>
            <th className="text-left p-4 font-medium text-slate-700">Priority</th>
            <th className="text-left p-4 font-medium text-slate-700">Category</th>
            <th className="text-left p-4 font-medium text-slate-700">Created</th>
            <th className="text-left p-4 font-medium text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((request, index) => (
            <tr key={request._id} className={index % 2 === 0 ? "bg-white" : "bg-slate-25"}>
              <td className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{request.title}</p>
                    <p className="text-sm text-slate-600 truncate max-w-xs">{request.description}</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(request.status)} size="sm">
                    {request.status}
                  </Badge>
                  {request.signatureProvided && (
                    <Badge className="bg-green-100 text-green-800" size="sm">
                      <PenTool className="w-3 h-3 mr-1" />
                      Signed
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-4">
                <Badge className={getPriorityColor(request.priority)} size="sm">
                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                </Badge>
              </td>
              <td className="p-4">
                <Badge variant="outline" size="sm">
                  {request.category}
                </Badge>
              </td>
              <td className="p-4">
                <div className="text-sm text-slate-600">{new Date(request.createdAt).toLocaleDateString()}</div>
              </td>
              <td className="p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openViewDialog(request)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {request.status.toLowerCase() === "pending" && (
                      <DropdownMenuItem onClick={() => openEditDialog(request)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Request
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(request)}>
                      <Trash2 className="w-4 h-4 mr-2" />
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading requests...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Requests</h1>
          <p className="text-slate-600 mt-1">Track and manage your submitted requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 border rounded-lg p-1">
            <Button variant={viewMode === "card" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("card")}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List className="w-4 h-4" />
            </Button>
          </div>
          {/* <Link href="/dashboard/requests/create">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Request
            </Button>
          </Link> */}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Requests by Status */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
          <TabsTrigger value="need signature">Need Signature ({statusCounts["need signature"]})</TabsTrigger>
          <TabsTrigger value="sent back">Sent Back ({statusCounts["sent back"]})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">No requests found</h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "You haven't created any requests yet"}
                </p>
                <Link href="/dashboard/requests/create">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Request
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Request Details: {selectedRequest?.title}</span>
              {selectedRequest?.signatureProvided && (
                <Badge className="bg-green-100 text-green-800">
                  <PenTool className="w-3 h-3 mr-1" />
                  Signed
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>Complete information about this request</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Overview */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Category</Label>
                  <p className="text-slate-800 capitalize">{selectedRequest.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Priority</Label>
                  <Badge className={getPriorityColor(selectedRequest.priority)}>{selectedRequest.priority}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>{selectedRequest.status}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created</Label>
                  <p className="text-slate-800">
                    {formatDateTime(selectedRequest.createdAt).date} at {formatDateTime(selectedRequest.createdAt).time}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Last Updated</Label>
                  <p className="text-slate-800">
                    {formatDateTime(selectedRequest.updatedAt).date} at {formatDateTime(selectedRequest.updatedAt).time}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Request ID</Label>
                  <p className="text-slate-800 font-mono text-sm">{selectedRequest._id}</p>
                </div>
              </div>

              {/* Requester Information */}
              <div className="p-4 border rounded-lg">
                <Label className="text-sm font-medium text-slate-600 mb-3 block">Submitted By</Label>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {selectedRequest.createdBy.firstName} {selectedRequest.createdBy.lastName}
                    </p>
                    <p className="text-sm text-slate-600">{selectedRequest.createdBy.email}</p>
                  </div>
                </div>
              </div>

              {/* Target Departments */}
              {selectedRequest.targetDepartments && selectedRequest.targetDepartments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Target Departments</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.targetDepartments.map((dept, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">{dept.name}</p>
                          <p className="text-sm text-slate-600">{dept.description}</p>
                        </div>
                        <Badge variant="outline">{dept.name}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Directors */}
              {selectedRequest.assignedDirectors && selectedRequest.assignedDirectors.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Assigned Directors</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.assignedDirectors.map((assignment, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {assignment.director.firstName} {assignment.director.lastName}
                              </p>
                              <p className="text-sm text-slate-600">{assignment.director.email}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                        </div>
                        {assignment.actionComment && (
                          <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                            <p className="text-slate-700">{assignment.actionComment}</p>
                            {assignment.actionDate && (
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDateTime(assignment.actionDate).date} at{" "}
                                {formatDateTime(assignment.actionDate).time}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-slate-600">Description</Label>
                <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-800 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Signature Information */}
              {(selectedRequest.requiresSignature || selectedRequest.signatureProvided) && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-slate-700">Signature Information</Label>
                    <div className="flex items-center space-x-2">
                      {selectedRequest.signatureProvided ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Signature Provided
                        </Badge>
                      ) : selectedRequest.requiresSignature ? (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Signature Required
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {selectedRequest.signatureProvided && selectedRequest.signatureData && (
                    <div className="mt-3 p-3 bg-white rounded-lg border">
                      <Label className="text-xs text-slate-600 mb-2 block">Digital Signature</Label>
                      <img
                        src={selectedRequest.signatureData || "/placeholder.svg"}
                        alt="Digital signature"
                        className="max-h-20 max-w-full object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Comments & Signatures */}
              {selectedRequest.comments && selectedRequest.comments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Comments & Activity</Label>
                  <div className="mt-2 space-y-3">
                    {selectedRequest.comments.map((comment, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${comment.isSignature ? "bg-green-50 border-green-200" : "bg-slate-50"}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              {comment.isSignature ? (
                                <PenTool className="w-3 h-3 text-blue-600" />
                              ) : (
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {comment.author.firstName} {comment.author.lastName}
                              </p>
                              <p className="text-xs text-slate-600">{comment.author.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt).date}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt).time}</p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-700 mb-2">{comment.text}</p>

                        {comment.isSignature && comment.signatureData && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <Label className="text-xs text-slate-600 mb-1 block">Digital Signature</Label>
                            <img
                              src={comment.signatureData || "/placeholder.svg"}
                              alt="Comment signature"
                              className="max-h-16 max-w-full object-contain"
                            />
                          </div>
                        )}

                        {comment.isSignature && (
                          <div className="mt-2 flex items-center space-x-1 text-green-700">
                            <Shield className="w-3 h-3" />
                            <span className="text-xs font-medium">Verified Digital Signature</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Action Details */}
              {selectedRequest.actionBy && (
                <div className="p-4 border rounded-lg bg-green-50">
                  <Label className="text-sm font-medium text-slate-600 mb-3 block">Final Action Details</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-600">Action Taken By</Label>
                      <p className="text-sm font-medium text-slate-800">
                        {selectedRequest.actionBy.firstName} {selectedRequest.actionBy.lastName}
                      </p>
                      <p className="text-xs text-slate-600">{selectedRequest.actionBy.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Action Date</Label>
                      <p className="text-sm text-slate-800">
                        {selectedRequest.actionDate && (
                          <>
                            {formatDateTime(selectedRequest.actionDate).date} at{" "}
                            {formatDateTime(selectedRequest.actionDate).time}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {selectedRequest.actionComment && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <Label className="text-xs text-slate-600">Final Comment</Label>
                      <p className="text-sm text-slate-800 mt-1">{selectedRequest.actionComment}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Attachments</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{attachment.name}</p>
                            <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Request: {selectedRequest?.title}</DialogTitle>
            <DialogDescription>Update your request details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <select
                  id="edit-priority"
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} className="bg-orange-500 hover:bg-orange-600">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedRequest?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => selectedRequest && handleDelete(selectedRequest._id)}>
              Delete Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
