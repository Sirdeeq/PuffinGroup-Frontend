"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

interface RequestItem {
  _id: string
  title: string
  description: string
  targetDepartment: string
  assignedDirector?: string
  priority: string
  category: string
  status: string
  createdAt: string
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
  attachments: any[]
  requiresSignature?: boolean
  actionComment?: string
  actionDate?: string
}

export default function RequestsPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)

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

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.targetDepartment && request.targetDepartment.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === "all" || request.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (requestId: string) => {
    try {
      const response = await api.deleteRequest(requestId, authContext)

      if (response.success) {
        setRequests((prev) => prev.filter((request) => request._id !== requestId))
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
          <h1 className="text-3xl font-bold text-slate-800">My Requests</h1>
          <p className="text-slate-600 mt-1">Track and manage your submitted requests</p>
        </div>
        <Link href="/requests/create">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Request
          </Button>
        </Link>
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
                <Link href="/requests/create">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Request
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 rounded-full bg-orange-100">
                          <MessageSquare className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-800">{request.title}</h3>
                          <p className="text-slate-600 mt-1 line-clamp-2">{request.description}</p>

                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <User className="w-4 h-4" />
                              <span>
                                By: {request.createdBy.firstName} {request.createdBy.lastName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 mt-3">
                            {request.targetDepartment && (
                              <Badge variant="outline" className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {request.targetDepartment}
                              </Badge>
                            )}
                            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                            <Badge className={getPriorityColor(request.priority)}>
                              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                            </Badge>
                            <Badge variant="outline">{request.category}</Badge>
                          </div>

                          {request.status === "Need Signature" && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-2 text-blue-800">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Action Required</span>
                              </div>
                              <p className="text-sm text-blue-700 mt-1">
                                Your signature or consent is required to proceed with this request.
                              </p>
                            </div>
                          )}

                          {request.actionComment && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                              <p className="text-sm text-slate-700">{request.actionComment}</p>
                              {request.actionDate && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(request.actionDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}

                          {request.attachments && request.attachments.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-slate-600 mb-1">
                                Attachments: {request.attachments.length}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/requests/${request._id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {request.status.toLowerCase() === "pending" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/requests/${request._id}/edit`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Request
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(request._id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
