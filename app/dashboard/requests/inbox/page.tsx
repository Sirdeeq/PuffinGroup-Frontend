"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  AlertCircle,
  Loader2,
} from "lucide-react"
import { redirect } from "next/navigation"

interface ReceivedRequest {
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
  attachments: Array<{
    name: string
    size: number
    type: string
  }>
}

export default function RequestInboxPage() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [receivedRequests, setReceivedRequests] = useState<ReceivedRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ReceivedRequest | null>(null)
  const [actionComment, setActionComment] = useState("")
  const [requireSignature, setRequireSignature] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Fetch received requests
  useEffect(() => {
    const fetchReceivedRequests = async () => {
      try {
        setLoading(true)
        // Get requests targeted to the user's department
        const response = await api.getIncomingRequests(authContext)

        if (response.success && response.data) {
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

  const handleRequestAction = async (action: "approve" | "reject" | "sendback" | "signature") => {
    if (!selectedRequest) return

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
        requireSignature: action === "signature" || requireSignature,
      }

      const response = await api.takeRequestAction(selectedRequest._id, actionData, authContext)

      if (response.success) {
        // Update local state to remove the processed request
        setReceivedRequests((prev) => prev.filter((req) => req._id !== selectedRequest._id))

        setSelectedRequest(null)
        setActionComment("")
        setRequireSignature(false)

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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approve":
        return CheckCircle
      case "reject":
        return XCircle
      case "sendback":
        return RotateCcw
      case "signature":
        return PenTool
      default:
        return CheckCircle
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "approve":
        return "bg-green-500 hover:bg-green-600"
      case "reject":
        return "bg-red-500 hover:bg-red-600"
      case "sendback":
        return "bg-orange-500 hover:bg-orange-600"
      case "signature":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

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
          <h1 className="text-3xl font-bold text-slate-800">Request Inbox</h1>
          <p className="text-slate-600 mt-1">Review and process incoming requests</p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          {receivedRequests.length} Pending
        </Badge>
      </div>

      {receivedRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No pending requests</h3>
            <p className="text-slate-600">All requests have been reviewed and processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {receivedRequests.map((request) => (
            <Card key={request._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 rounded-full bg-orange-100">
                      <MessageSquare className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800">{request.title}</h3>
                      <p className="text-slate-600 mt-1">{request.description}</p>

                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <User className="w-4 h-4" />
                          <span>
                            From: {request.createdBy.firstName} {request.createdBy.lastName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-3">
                        {request.targetDepartment && (
                          <Badge variant="outline" className="flex items-center">
                            <Building2 className="w-3 h-3 mr-1" />
                            {request.targetDepartment}
                          </Badge>
                        )}
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority.toLowerCase() === "urgent" && <AlertCircle className="w-3 h-3 mr-1" />}
                          {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                        </Badge>
                        <Badge variant="outline">{request.category}</Badge>
                        <Badge className="bg-orange-100 text-orange-800">{request.status}</Badge>
                      </div>

                      {request.attachments && request.attachments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-slate-600 mb-2">Attachments:</p>
                          <div className="space-y-1">
                            {request.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm text-slate-600">
                                <MessageSquare className="w-4 h-4" />
                                <span>{attachment.name}</span>
                                <span className="text-slate-400">({formatFileSize(attachment.size)})</span>
                                <Button variant="ghost" size="sm">
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedRequest(request)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Review Request: {selectedRequest?.title}</DialogTitle>
                          <DialogDescription>Take action on this request submission</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Request Details */}
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-medium text-slate-800 mb-2">Request Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-600">Category:</span>
                                <span className="ml-2 font-medium">{selectedRequest?.category}</span>
                              </div>
                              <div>
                                <span className="text-slate-600">Priority:</span>
                                <Badge className={getPriorityColor(selectedRequest?.priority || "")} size="sm">
                                  {selectedRequest?.priority}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-slate-600">Submitted by:</span>
                                <span className="ml-2 font-medium">
                                  {selectedRequest?.createdBy.firstName} {selectedRequest?.createdBy.lastName}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-600">Created:</span>
                                <span className="ml-2 font-medium">
                                  {selectedRequest && new Date(selectedRequest.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Comment Section */}
                          <div className="space-y-2">
                            <Label htmlFor="action-comment">Response Comment</Label>
                            <Textarea
                              id="action-comment"
                              placeholder="Add your response or feedback..."
                              value={actionComment}
                              onChange={(e) => setActionComment(e.target.value)}
                              rows={3}
                            />
                          </div>

                          {/* Signature Requirement */}
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor="require-signature">Require Signature/Consent</Label>
                              <p className="text-sm text-slate-600">Request signature before final approval</p>
                            </div>
                            <Switch
                              id="require-signature"
                              checked={requireSignature}
                              onCheckedChange={setRequireSignature}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end space-x-3">
                            {["approve", "signature", "sendback", "reject"].map((action) => {
                              const IconComponent = getActionIcon(action)
                              return (
                                <Button
                                  key={action}
                                  onClick={() => handleRequestAction(action as any)}
                                  disabled={isProcessing}
                                  className={getActionColor(action)}
                                >
                                  <IconComponent className="w-4 h-4 mr-2" />
                                  {isProcessing ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : action === "signature" ? (
                                    "Request Signature"
                                  ) : (
                                    action.charAt(0).toUpperCase() + action.slice(1)
                                  )}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
