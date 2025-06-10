"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Building2,
  ArrowLeft,
  PenTool,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  MessageSquare,
  Calendar,
  Edit,
} from "lucide-react"
import Link from "next/link"

interface RequestItem {
  id: number
  title: string
  description: string
  targetDepartment: string
  assignedDirector?: string
  priority: string
  category: string
  status: string
  createdAt: string
  createdBy: string
  attachments: any[]
  comments?: { author: string; date: string; text: string; isSignature?: boolean }[]
  actionComment?: string
  actionDate?: string
  requiresSignature?: boolean
}

export default function ViewRequestPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [request, setRequest] = useState<RequestItem | null>(null)
  const [newComment, setNewComment] = useState("")
  const [signatureData, setSignatureData] = useState({ hasSignature: false, signatureUrl: "", signatureText: "" })
  const [isAddingSignature, setIsAddingSignature] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    // Get user role
    const role = localStorage.getItem("userRole") || ""
    setUserRole(role)

    // Load signature data
    const savedSignature = localStorage.getItem("signatureData")
    if (savedSignature) {
      setSignatureData(JSON.parse(savedSignature))
    }

    // Load request data
    const requestId = params.id
    if (requestId) {
      loadRequestData(requestId as string)
    }

    setIsLoading(false)
  }, [params.id])

  const loadRequestData = (requestId: string) => {
    // First check localStorage
    const savedRequests = JSON.parse(localStorage.getItem("requests") || "[]")
    const receivedRequests = JSON.parse(localStorage.getItem("receivedRequests") || "[]")

    // Mock requests for demonstration
    const mockRequests = [
      {
        id: 1,
        title: "Budget Approval for Q2 Marketing Campaign",
        description:
          "Requesting approval for Q2 marketing budget allocation of $50,000 for digital advertising campaigns across social media platforms and Google Ads. This budget will help us reach our target audience more effectively and increase brand awareness.",
        targetDepartment: "Finance",
        assignedDirector: "Sarah Johnson",
        priority: "high",
        category: "budget",
        status: "Need Signature",
        createdAt: "2024-01-20",
        createdBy: "John Doe",
        attachments: [
          { name: "budget_proposal.pdf", size: 2048000 },
          { name: "marketing_strategy.docx", size: 1024000 },
        ],
        comments: [
          {
            author: "Sarah Johnson",
            date: "2024-01-21T10:30:00Z",
            text: "Please provide more details on the expected ROI for this campaign. The budget seems reasonable but I need to understand the projected returns.",
          },
          {
            author: "John Doe",
            date: "2024-01-22T14:15:00Z",
            text: "The expected ROI is 3.5x based on previous campaign performance. Details are in the attached document. We've seen similar campaigns generate 250% returns in the past 6 months.",
          },
        ],
        requiresSignature: true,
      },
      {
        id: 2,
        title: "IT Equipment Request",
        description:
          "Need new laptops for development team to improve productivity and support new software requirements.",
        targetDepartment: "IT",
        priority: "medium",
        category: "support",
        status: "Approved",
        createdAt: "2024-01-18",
        createdBy: "Alice Smith",
        attachments: [],
        comments: [
          {
            author: "IT Director",
            date: "2024-01-19T09:00:00Z",
            text: "Approved. Please coordinate with procurement for the purchase.",
          },
        ],
      },
      {
        id: 3,
        title: "Policy Clarification on Remote Work",
        description: "Need clarification on new remote work policies and their implementation across departments.",
        targetDepartment: "HR",
        assignedDirector: "Mike Wilson",
        priority: "low",
        category: "policy",
        status: "Pending",
        createdAt: "2024-01-15",
        createdBy: "Emma Davis",
        attachments: [{ name: "policy_questions.docx", size: 1024000 }],
        comments: [],
      },
    ]

    // Combine all arrays and find the request
    const allRequests = [...savedRequests, ...receivedRequests, ...mockRequests]
    const foundRequest = allRequests.find((r) => r.id.toString() === requestId.toString())

    if (foundRequest) {
      // Initialize comments array if it doesn't exist
      if (!foundRequest.comments) {
        foundRequest.comments = []
      }

      // If there's an action comment, add it as a comment
      if (foundRequest.actionComment && !foundRequest.comments.some((c) => c.text === foundRequest.actionComment)) {
        foundRequest.comments.push({
          author: "System",
          date: foundRequest.actionDate || new Date().toISOString(),
          text: foundRequest.actionComment,
        })
      }

      setRequest(foundRequest)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-orange-100 text-orange-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Need Signature":
        return "bg-blue-100 text-blue-800"
      case "Sent Back":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting",
        variant: "destructive",
      })
      return
    }

    if (!request) return

    const updatedRequest = {
      ...request,
      comments: [
        ...(request.comments || []),
        {
          author: "Current User",
          date: new Date().toISOString(),
          text: newComment,
          isSignature: isAddingSignature,
        },
      ],
    }

    // If adding signature and status is "Need Signature", update status to "Approved"
    if (isAddingSignature && request.status === "Need Signature") {
      updatedRequest.status = "Approved"
    }

    setRequest(updatedRequest)

    // Update in localStorage
    const savedRequests = JSON.parse(localStorage.getItem("requests") || "[]")
    const updatedRequests = savedRequests.map((r: any) => (r.id === request.id ? updatedRequest : r))
    localStorage.setItem("requests", JSON.stringify(updatedRequests))

    // Also update in receivedRequests
    const receivedRequests = JSON.parse(localStorage.getItem("receivedRequests") || "[]")
    const updatedReceivedRequests = receivedRequests.map((r: any) => (r.id === request.id ? updatedRequest : r))
    localStorage.setItem("receivedRequests", JSON.stringify(updatedReceivedRequests))

    setNewComment("")
    setIsAddingSignature(false)

    toast({
      title: isAddingSignature ? "Signature added" : "Comment added",
      description: isAddingSignature ? "Your signature has been added to the request" : "Your comment has been added",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return CheckCircle
      case "Rejected":
        return XCircle
      case "Need Signature":
        return PenTool
      case "Sent Back":
        return AlertCircle
      default:
        return Clock
    }
  }

  const canEdit = () => {
    return request?.status === "Pending" || request?.status === "Sent Back"
  }

  const canAddSignature = () => {
    return request?.status === "Need Signature" && signatureData.hasSignature
  }

  const StatusIcon = request ? getStatusIcon(request.status) : Clock

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">Request not found</h2>
        <p className="text-slate-600 mt-2">The requested item could not be found</p>
        <Link href="/dashboard/requests">
          <Button className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/requests" className="inline-flex items-center text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Requests</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">{request.title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {canEdit() && (
            <Link href={`/dashboard/requests/edit/${request.id}`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Request
              </Button>
            </Link>
          )}
          <Badge className={getStatusColor(request.status)} size="lg">
            <StatusIcon className="w-4 h-4 mr-1" />
            {request.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>Information about this request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-800 whitespace-pre-line">{request.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center">
                    <Building2 className="w-3 h-3 mr-1" />
                    {request.targetDepartment}
                  </Badge>
                  <Badge className={getPriorityColor(request.priority)}>
                    {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                  </Badge>
                  <Badge variant="outline">{request.category}</Badge>
                  {request.assignedDirector && (
                    <Badge variant="outline" className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {request.assignedDirector}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <User className="w-4 h-4" />
                    <span>Created by: {request.createdBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {formatDate(request.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {request.attachments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800">Attachments</h4>
                  <div className="space-y-2">
                    {request.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-800">{attachment.name}</p>
                            <p className="text-sm text-slate-600">{formatFileSize(attachment.size)}</p>
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

              {/* Signature Required Notice */}
              {request.status === "Need Signature" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <PenTool className="w-5 h-5" />
                    <h4 className="font-medium">Signature Required</h4>
                  </div>
                  <p className="text-blue-700 mt-1">
                    This request requires your signature or consent before it can be processed.
                  </p>
                  {!signatureData.hasSignature && (
                    <p className="text-blue-600 text-sm mt-2">
                      Please set up your signature in{" "}
                      <Link href="/dashboard/settings/signature" className="underline">
                        Settings
                      </Link>{" "}
                      to sign this request.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments & Activity</CardTitle>
              <CardDescription>Communication history for this request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Comments */}
              {request.comments && request.comments.length > 0 ? (
                <div className="space-y-4">
                  {request.comments.map((comment, index) => (
                    <div key={index} className="border-l-4 border-slate-200 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-800">{comment.author}</span>
                          {comment.isSignature && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              <PenTool className="w-3 h-3 mr-1" />
                              Signature
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-slate-600">{formatDate(comment.date)}</span>
                      </div>
                      <p className="text-slate-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-center py-4">No comments yet</p>
              )}

              {/* Add Comment */}
              <div className="space-y-4 pt-4 border-t">
                <Label htmlFor="new-comment">Add Comment</Label>
                <Textarea
                  id="new-comment"
                  placeholder="Add your comment or feedback..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />

                {canAddSignature() && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-signature"
                      checked={isAddingSignature}
                      onChange={(e) => setIsAddingSignature(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="add-signature" className="text-sm">
                      Add my signature to this comment
                    </Label>
                  </div>
                )}

                <Button onClick={handleAddComment} className="bg-orange-500 hover:bg-orange-600">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {isAddingSignature ? "Add Comment with Signature" : "Add Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Info */}
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(request.status)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {request.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Priority</Label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Category</Label>
                  <p className="mt-1 text-slate-800">{request.category}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Department</Label>
                  <p className="mt-1 text-slate-800">{request.targetDepartment}</p>
                </div>

                {request.assignedDirector && (
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Assigned Director</Label>
                    <p className="mt-1 text-slate-800">{request.assignedDirector}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-slate-600">Created By</Label>
                  <p className="mt-1 text-slate-800">{request.createdBy}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Created Date</Label>
                  <p className="mt-1 text-slate-800">{formatDate(request.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {canEdit() && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href={`/dashboard/requests/edit/${request.id}`}>
                    <Button variant="outline" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Request
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
