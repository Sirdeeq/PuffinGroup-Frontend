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
import { useToast } from "@/hooks/use-toast"
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
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from "@react-pdf/renderer"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"

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
    actionComment?: string
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
  signatureDate?: string
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

// Enhanced PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
    paddingBottom: 25,
    borderBottomWidth: 3,
    borderBottomColor: "#3b82f6",
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 8,
  },
  logo: {
    width: 100,
    height: 100,
  },
  companyInfo: {
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  companySubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 30,
    textAlign: "center",
    backgroundColor: "#f1f5f9",
    padding: 15,
    borderRadius: 8,
  },
  section: {
    marginBottom: 25,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 15,
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    padding: 10,
    borderRadius: 6,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#475569",
    width: 140,
    marginRight: 15,
  },
  value: {
    fontSize: 11,
    color: "#1e293b",
    flex: 1,
  },
  description: {
    fontSize: 11,
    color: "#1e293b",
    lineHeight: 1.6,
    marginTop: 8,
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  badge: {
    fontSize: 9,
    color: "#ffffff",
    backgroundColor: "#3b82f6",
    padding: 6,
    borderRadius: 6,
    marginRight: 8,
    fontWeight: "bold",
  },
  statusApproved: {
    backgroundColor: "#10b981",
  },
  statusPending: {
    backgroundColor: "#f59e0b",
  },
  statusRejected: {
    backgroundColor: "#ef4444",
  },
  statusNeedSignature: {
    backgroundColor: "#3b82f6",
  },
  statusSentBack: {
    backgroundColor: "#f97316",
  },
  priorityHigh: {
    backgroundColor: "#ef4444",
  },
  priorityMedium: {
    backgroundColor: "#f59e0b",
  },
  priorityLow: {
    backgroundColor: "#3b82f6",
  },
  priorityUrgent: {
    backgroundColor: "#8b5cf6",
  },
  table: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeader: {
    backgroundColor: "#f1f5f9",
    fontWeight: "bold",
  },
  tableCell: {
    fontSize: 10,
    padding: 6,
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#64748b",
    borderTopWidth: 2,
    borderTopColor: "#e2e8f0",
    paddingTop: 15,
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 8,
  },
  signatureSection: {
    marginTop: 25,
    padding: 20,
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#10b981",
  },
  signatureImage: {
    width: 200,
    height: 100,
    marginTop: 15,
    borderWidth: 2,
    borderColor: "#10b981",
    borderRadius: 8,
  },
  commentSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  urgentBadge: {
    backgroundColor: "#dc2626",
    fontSize: 10,
    padding: 8,
    borderRadius: 6,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-45deg)",
    fontSize: 60,
    color: "#f1f5f9",
    opacity: 0.1,
    zIndex: -1,
  },
})

// Enhanced PDF Document Component
const RequestPDF = ({ request }: { request: RequestItem }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return pdfStyles.statusApproved
      case "pending":
        return pdfStyles.statusPending
      case "rejected":
        return pdfStyles.statusRejected
      case "need signature":
        return pdfStyles.statusNeedSignature
      case "sent back":
        return pdfStyles.statusSentBack
      default:
        return {}
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return pdfStyles.priorityUrgent
      case "high":
        return pdfStyles.priorityHigh
      case "medium":
        return pdfStyles.priorityMedium
      case "low":
        return pdfStyles.priorityLow
      default:
        return {}
    }
  }

  const getSentBackComment = () => {
    const sentBackAction = request.actionHistory?.find((action) => action.action === "sent_back")
    return sentBackAction?.comment || ""
  }

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Watermark */}
        <Text style={pdfStyles.watermark}>PUFFIN GROUP</Text>

        {/* Header with Logo */}
        <View style={pdfStyles.header}>
          <Image style={pdfStyles.logo} src="/logo.png" />
          <View style={pdfStyles.companyInfo}>
            <Text style={pdfStyles.companyName}>Puffin Group</Text>
            <Text style={pdfStyles.companySubtitle}>Request Management System</Text>
            <Text style={pdfStyles.companySubtitle}>Generated on {new Date().toLocaleDateString()}</Text>
            <Text style={pdfStyles.companySubtitle}>Document ID: {request._id.slice(-8).toUpperCase()}</Text>
          </View>
        </View>

        {/* Title with Status */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 30 }}>
          <Text style={pdfStyles.title}>Request Details Report</Text>
          <Text style={[pdfStyles.badge, getStatusStyle(request.status)]}>{request.status.toUpperCase()}</Text>
          {request.isUrgent && <Text style={pdfStyles.urgentBadge}>🚨 URGENT</Text>}
        </View>

        {/* Basic Information */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>📋 Request Information</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Request ID:</Text>
            <Text style={pdfStyles.value}>{request._id}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Title:</Text>
            <Text style={pdfStyles.value}>{request.title}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Category:</Text>
            <Text style={pdfStyles.value}>{request.category.replace("_", " ").toUpperCase()}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Priority:</Text>
            <Text style={[pdfStyles.badge, getPriorityStyle(request.priority)]}>{request.priority.toUpperCase()}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Status:</Text>
            <Text style={[pdfStyles.badge, getStatusStyle(request.status)]}>{request.status.toUpperCase()}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Created:</Text>
            <Text style={pdfStyles.value}>{formatDate(request.createdAt)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Last Updated:</Text>
            <Text style={pdfStyles.value}>{formatDate(request.updatedAt)}</Text>
          </View>
          {request.dueDate && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Due Date:</Text>
              <Text style={pdfStyles.value}>{formatDate(request.dueDate)}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>📝 Description</Text>
          <Text style={pdfStyles.description}>{request.description}</Text>
        </View>

        {/* Sent Back Comment */}
        {request.status.toLowerCase() === "sent back" && getSentBackComment() && (
          <View style={pdfStyles.commentSection}>
            <Text style={[pdfStyles.sectionTitle, { backgroundColor: "#f59e0b" }]}>⚠️ Sent Back Reason</Text>
            <Text style={pdfStyles.description}>{getSentBackComment()}</Text>
          </View>
        )}

        {/* Created By */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>👤 Created By</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Name:</Text>
            <Text style={pdfStyles.value}>
              {request.createdBy.firstName} {request.createdBy.lastName}
            </Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Email:</Text>
            <Text style={pdfStyles.value}>{request.createdBy.email}</Text>
          </View>
        </View>

        {/* Target Departments */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>🏢 Target Departments</Text>
          {request.targetDepartments.map((dept, index) => (
            <View key={dept._id} style={pdfStyles.row}>
              <Text style={pdfStyles.label}>{index + 1}.</Text>
              <Text style={pdfStyles.value}>
                {dept.name} - {dept.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Assigned Directors */}
        {request.assignedDirectors.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>👨‍💼 Assigned Directors</Text>
            {request.assignedDirectors.map((assignment, index) => (
              <View key={assignment._id}>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Director:</Text>
                  <Text style={pdfStyles.value}>
                    {assignment.director
                      ? `${assignment.director.firstName} ${assignment.director.lastName} (${assignment.director.email})`
                      : "Not assigned"}
                  </Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Status:</Text>
                  <Text style={[pdfStyles.badge, getStatusStyle(assignment.status)]}>
                    {assignment.status.toUpperCase()}
                  </Text>
                </View>
                {assignment.actionComment && (
                  <View style={pdfStyles.row}>
                    <Text style={pdfStyles.label}>Comment:</Text>
                    <Text style={pdfStyles.value}>{assignment.actionComment}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Department Approvals */}
        {request.departmentApprovals && request.departmentApprovals.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>✅ Department Approvals</Text>
            <View style={pdfStyles.table}>
              <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
                <Text style={pdfStyles.tableCell}>Department</Text>
                <Text style={pdfStyles.tableCell}>Status</Text>
                <Text style={pdfStyles.tableCell}>Approved By</Text>
                <Text style={pdfStyles.tableCell}>Date</Text>
              </View>
              {request.departmentApprovals.map((approval, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>{approval.department.name}</Text>
                  <Text style={pdfStyles.tableCell}>{approval.status}</Text>
                  <Text style={pdfStyles.tableCell}>
                    {approval.approvedBy ? `${approval.approvedBy.firstName} ${approval.approvedBy.lastName}` : "N/A"}
                  </Text>
                  <Text style={pdfStyles.tableCell}>
                    {approval.actionDate ? formatDate(approval.actionDate) : "N/A"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Attachments */}
        {request.attachments.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>📎 Attachments</Text>
            {request.attachments.map((attachment, index) => (
              <View key={index} style={pdfStyles.row}>
                <Text style={pdfStyles.label}>{index + 1}.</Text>
                <Text style={pdfStyles.value}>
                  {attachment.name} ({(attachment.size / 1024).toFixed(2)} KB)
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Digital Signature Section */}
        {request.requiresSignature && (
          <View style={pdfStyles.signatureSection}>
            <Text style={[pdfStyles.sectionTitle, { backgroundColor: "#10b981" }]}>✍️ Digital Signature</Text>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Required:</Text>
              <Text style={pdfStyles.value}>Yes</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Provided:</Text>
              <Text style={pdfStyles.value}>{request.signatureProvided ? "Yes" : "No"}</Text>
            </View>
            {request.signatureProvided && request.signatureDate && (
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Signed On:</Text>
                <Text style={pdfStyles.value}>{formatDate(request.signatureDate)}</Text>
              </View>
            )}
            {request.signatureProvided && request.signatureData && (
              <View>
                <Text style={pdfStyles.label}>Digital Signature:</Text>
                <Image style={pdfStyles.signatureImage} src={request.signatureData || "/placeholder.svg"} />
              </View>
            )}
          </View>
        )}

        {/* Comments */}
        {request.comments.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>💬 Comments & Activity</Text>
            {request.comments.map((comment, index) => (
              <View
                key={comment._id}
                style={{ marginBottom: 15, padding: 10, backgroundColor: "#f8fafc", borderRadius: 6 }}
              >
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>By:</Text>
                  <Text style={pdfStyles.value}>
                    {comment.author.firstName} {comment.author.lastName}
                  </Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Date:</Text>
                  <Text style={pdfStyles.value}>{formatDate(comment.createdAt)}</Text>
                </View>
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Comment:</Text>
                  <Text style={pdfStyles.value}>{comment.text}</Text>
                </View>
                {comment.isSignature && (
                  <Text style={[pdfStyles.badge, pdfStyles.statusApproved]}>DIGITAL SIGNATURE</Text>
                )}
                {comment.signatureData && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={pdfStyles.label}>Signature:</Text>
                    <Image style={pdfStyles.signatureImage} src={comment.signatureData || "/placeholder.svg"} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          This document was generated automatically by Puffin Group Request Management System
          {"\n"}© 2025 Puffin Group. All rights reserved.
          {"\n"}For inquiries, contact: support@puffingroup.com
        </Text>
      </Page>
    </Document>
  )
}

// Enhanced Status Tags Component
const StatusTag = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return {
          icon: "✅",
          color: "bg-gradient-to-r from-emerald-500 to-green-500",
          textColor: "text-white",
          borderColor: "border-emerald-200",
          bgLight: "bg-emerald-50",
        }
      case "pending":
        return {
          icon: "⏳",
          color: "bg-gradient-to-r from-amber-500 to-orange-500",
          textColor: "text-white",
          borderColor: "border-amber-200",
          bgLight: "bg-amber-50",
        }
      case "rejected":
        return {
          icon: "❌",
          color: "bg-gradient-to-r from-red-500 to-rose-500",
          textColor: "text-white",
          borderColor: "border-red-200",
          bgLight: "bg-red-50",
        }
      case "need signature":
        return {
          icon: "✍️",
          color: "bg-gradient-to-r from-blue-500 to-indigo-500",
          textColor: "text-white",
          borderColor: "border-blue-200",
          bgLight: "bg-blue-50",
        }
      case "sent back":
        return {
          icon: "↩️",
          color: "bg-gradient-to-r from-orange-500 to-amber-500",
          textColor: "text-white",
          borderColor: "border-orange-200",
          bgLight: "bg-orange-50",
        }
      case "in review":
        return {
          icon: "👀",
          color: "bg-gradient-to-r from-purple-500 to-violet-500",
          textColor: "text-white",
          borderColor: "border-purple-200",
          bgLight: "bg-purple-50",
        }
      default:
        return {
          icon: "📄",
          color: "bg-gradient-to-r from-slate-500 to-gray-500",
          textColor: "text-white",
          borderColor: "border-slate-200",
          bgLight: "bg-slate-50",
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge
      className={`${config.color} ${config.textColor} border-0 text-sm px-4 py-2 font-bold shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <span className="mr-2">{config.icon}</span>
      {status}
    </Badge>
  )
}

// Enhanced Priority Tag Component
const PriorityTag = ({ priority }: { priority: string }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return {
          icon: "🚨",
          color: "bg-gradient-to-r from-purple-600 to-violet-600",
          textColor: "text-white",
          pulse: "animate-pulse",
        }
      case "high":
        return {
          icon: "🔴",
          color: "bg-gradient-to-r from-red-500 to-rose-500",
          textColor: "text-white",
          pulse: "",
        }
      case "medium":
        return {
          icon: "🟡",
          color: "bg-gradient-to-r from-orange-500 to-amber-500",
          textColor: "text-white",
          pulse: "",
        }
      case "low":
        return {
          icon: "🟢",
          color: "bg-gradient-to-r from-blue-500 to-indigo-500",
          textColor: "text-white",
          pulse: "",
        }
      default:
        return {
          icon: "⚪",
          color: "bg-gradient-to-r from-slate-500 to-gray-500",
          textColor: "text-white",
          pulse: "",
        }
    }
  }

  const config = getPriorityConfig(priority)

  return (
    <Badge
      className={`${config.color} ${config.textColor} ${config.pulse} border-0 text-sm px-4 py-2 font-bold shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <span className="mr-2">{config.icon}</span>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

export default function RequestsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null)
  const authContext = useAuth()

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
      request.targetDepartments.some((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = filterStatus === "all" || request.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

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

  const getSentBackComment = (request: RequestItem) => {
    const sentBackAction = request.actionHistory?.find((action) => action.action === "sent_back")
    return sentBackAction?.comment || ""
  }

  const RequestCard = ({ request }: { request: RequestItem }) => (
    <Card className="hover:shadow-2xl transition-all duration-300 h-fit bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform translate-x-16 -translate-y-16"></div>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 shadow-md">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-800 line-clamp-2 mb-2">{request.title}</h3>
                <p className="text-slate-600 text-base line-clamp-3 leading-relaxed">{request.description}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0 hover:shadow-lg transition-shadow border-2 bg-transparent h-10 w-10"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSelectedRequest(request)} className="text-base py-3">
                  <Eye className="w-5 h-5 mr-3" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem className="text-base py-3">
                  <PDFDownloadLink
                    document={<RequestPDF request={request} />}
                    fileName={`request-${request._id}.pdf`}
                    className="flex items-center w-full"
                  >
                    {({ loading }) => (
                      <>
                        <Download className="w-5 h-5 mr-3" />
                        {loading ? "Generating PDF..." : "Download PDF"}
                      </>
                    )}
                  </PDFDownloadLink>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-base py-3">
                  <Edit className="w-5 h-5 mr-3" />
                  Edit Request
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 text-base py-3">
                  <Trash2 className="w-5 h-5 mr-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-slate-600">
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <span className="text-base">{formatDateTime(request.createdAt).relative}</span>
              <span className="text-sm text-slate-500">({formatDateTime(request.createdAt).date})</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600">
              <User className="w-5 h-5 flex-shrink-0" />
              <span className="text-base truncate">
                {request.createdBy.firstName} {request.createdBy.lastName}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600">
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className="text-base">
                {request.targetDepartments.length} department{request.targetDepartments.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusTag status={request.status} />
            <PriorityTag priority={request.priority} />
            <Badge className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200 text-sm px-4 py-2 font-medium shadow-sm">
              {request.category.replace("_", " ").toUpperCase()}
            </Badge>
            {request.signatureProvided && (
              <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 text-sm px-4 py-2 font-medium shadow-sm">
                <PenTool className="w-4 h-4 mr-1" />
                Signed
              </Badge>
            )}
            {request.isUrgent && (
              <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200 text-sm px-4 py-2 font-medium shadow-sm animate-pulse">
                🚨 Urgent
              </Badge>
            )}
          </div>

          {/* Sent Back Comment */}
          {request.status.toLowerCase() === "sent back" && getSentBackComment(request) && (
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-l-4 border-orange-400">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowLeft className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">Sent Back Reason:</span>
              </div>
              <p className="text-sm text-orange-700 italic">{getSentBackComment(request)}</p>
            </div>
          )}

          {/* Signature Display */}
          {request.signatureProvided && request.signatureData && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-l-4 border-emerald-400">
              <div className="flex items-center space-x-2 mb-3">
                <PenTool className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">Digital Signature Provided</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <img
                  src={request.signatureData || "/placeholder.svg"}
                  alt="Digital Signature"
                  className="w-32 h-16 object-contain"
                />
              </div>
              {request.signatureDate && (
                <p className="text-xs text-emerald-600 mt-2">Signed on {formatDateTime(request.signatureDate).date}</p>
              )}
            </div>
          )}

          {request.attachments && request.attachments.length > 0 && (
            <div className="flex items-center space-x-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
              <Paperclip className="w-5 h-5 flex-shrink-0" />
              <span className="text-base font-medium">{request.attachments.length} attachment(s)</span>
            </div>
          )}

          {request.dueDate && (
            <div className="flex items-center space-x-3 text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="text-base">Due: {new Date(request.dueDate).toLocaleDateString()}</span>
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
            <th className="text-left p-6 font-semibold text-slate-700 text-lg">Title</th>
            <th className="text-left p-6 font-semibold text-slate-700 text-lg">Status</th>
            <th className="text-left p-6 font-semibold text-slate-700 text-lg">Priority</th>
            <th className="text-left p-6 font-semibold text-slate-700 text-lg">Category</th>
            <th className="text-left p-6 font-semibold text-slate-700 text-lg">Created</th>
            <th className="text-left p-6 font-semibold text-slate-700 text-lg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((request, index) => (
            <tr
              key={request._id}
              className={`${index % 2 === 0 ? "bg-white" : "bg-slate-25"} hover:bg-slate-50 transition-colors`}
            >
              <td className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-lg truncate">{request.title}</p>
                    <p className="text-slate-600 truncate max-w-xs text-sm">{request.description}</p>
                    {request.isUrgent && <Badge className="bg-red-100 text-red-800 text-xs mt-1">🚨 Urgent</Badge>}
                  </div>
                </div>
              </td>
              <td className="p-6">
                <div className="flex flex-col space-y-2">
                  <StatusTag status={request.status} />
                  {request.signatureProvided && (
                    <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 text-xs px-2 py-1 w-fit">
                      <PenTool className="w-3 h-3 mr-1" />
                      Signed
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-6">
                <PriorityTag priority={request.priority} />
              </td>
              <td className="p-6">
                <Badge className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200 text-sm px-4 py-2 font-medium">
                  {request.category.replace("_", " ").toUpperCase()}
                </Badge>
              </td>
              <td className="p-6">
                <div className="text-slate-600 text-base">
                  <div>{formatDateTime(request.createdAt).relative}</div>
                  <div className="text-xs text-slate-500">{formatDateTime(request.createdAt).date}</div>
                </div>
              </td>
              <td className="p-6">
                <div className="flex items-center space-x-2">
                  <PDFDownloadLink document={<RequestPDF request={request} />} fileName={`request-${request._id}.pdf`}>
                    {({ loading }) => (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="hover:shadow-lg transition-shadow bg-transparent"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {loading ? "Generating..." : "PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:shadow-lg transition-shadow h-10 w-10">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSelectedRequest(request)} className="text-base py-3">
                        <Eye className="w-5 h-5 mr-3" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-base py-3">
                        <Edit className="w-5 h-5 mr-3" />
                        Edit Request
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 text-base py-3">
                        <Trash2 className="w-5 h-5 mr-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="absolute inset-0 h-12 w-12 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-20 animate-pulse"></div>
          </div>
          <span className="text-slate-600 text-xl">Loading requests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-10 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-purple-200 to-violet-200 rounded-full opacity-10 animate-float-delayed"></div>
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full opacity-10 animate-float"></div>

      <div className="relative z-10 space-y-8 px-6 py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-xl">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                  My Requests
                </h1>
                <p className="text-slate-600 text-xl mt-2">Track and manage your submitted requests</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center space-x-2 border-2 border-slate-200 rounded-2xl p-2 bg-white shadow-lg">
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("card")}
                className={viewMode === "card" ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" : ""}
              >
                <Grid3X3 className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">Cards</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" : ""}
              >
                <List className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">List</span>
              </Button>
            </div>
            <Link href="/dashboard/requests/create">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4 w-full sm:w-auto">
                <Plus className="w-5 h-5 mr-3" />
                Create Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Requests</p>
                  <p className="text-3xl font-bold text-blue-800">{statusCounts.all}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-amber-800">{statusCounts.pending}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-2xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 text-sm font-medium">Approved</p>
                  <p className="text-3xl font-bold text-emerald-800">{statusCounts.approved}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-2xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Rejected</p>
                  <p className="text-3xl font-bold text-red-800">{statusCounts.rejected}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-2xl">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-slate-50">
          <CardContent className="p-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
              <Input
                placeholder="Search requests by title, department, or director..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-14 text-lg border-2 border-slate-200 rounded-2xl bg-white shadow-inner focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-16 p-2 bg-white shadow-xl rounded-2xl border-0 min-w-[600px] sm:min-w-0">
              <TabsTrigger
                value="all"
                className="text-base py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl"
              >
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="text-base py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl"
              >
                Pending ({statusCounts.pending})
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="text-base py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl"
              >
                Approved ({statusCounts.approved})
              </TabsTrigger>
              <TabsTrigger
                value="need signature"
                className="text-base py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl"
              >
                <span className="hidden sm:inline">Need Signature</span>
                <span className="sm:hidden">Signature</span> ({statusCounts["need signature"]})
              </TabsTrigger>
              <TabsTrigger
                value="sent back"
                className="text-base py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl"
              >
                <span className="hidden sm:inline">Sent Back</span>
                <span className="sm:hidden">Sent</span> ({statusCounts["sent back"]})
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="text-base py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl"
              >
                Rejected ({statusCounts.rejected})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filterStatus} className="space-y-6">
            {filteredRequests.length === 0 ? (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
                <CardContent className="p-16 text-center">
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-slate-100 to-gray-100 rounded-full w-fit mx-auto">
                      <MessageSquare className="w-16 h-16 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-slate-800">No requests found</h3>
                      <p className="text-slate-600 text-lg max-w-md mx-auto">
                        {searchTerm || filterStatus !== "all"
                          ? "Try adjusting your search or filter criteria"
                          : "You haven't created any requests yet"}
                      </p>
                    </div>
                    <Link href="/dashboard/requests/create">
                      <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4">
                        <Plus className="w-5 h-5 mr-3" />
                        Create Your First Request
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredRequests.map((request) => (
                  <RequestCard key={request._id} request={request} />
                ))}
              </div>
            ) : (
              <RequestTable />
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced View Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
            <DialogHeader className="pb-6">
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <span>Request Details</span>
                {selectedRequest && <StatusTag status={selectedRequest.status} />}
                {selectedRequest?.signatureProvided && (
                  <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200">
                    <PenTool className="w-4 h-4 mr-1" />
                    Signed
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-lg">Complete information about this request</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-8">
                {/* Request Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Title</Label>
                    <p className="text-slate-800 font-semibold text-lg break-words">{selectedRequest.title}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Category</Label>
                    <p className="text-slate-800 capitalize text-lg font-semibold">
                      {selectedRequest.category.replace("_", " ")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Priority</Label>
                    <PriorityTag priority={selectedRequest.priority} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Status</Label>
                    <StatusTag status={selectedRequest.status} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Created</Label>
                    <p className="text-slate-800 font-medium text-base">
                      {formatDateTime(selectedRequest.createdAt).date} at{" "}
                      {formatDateTime(selectedRequest.createdAt).time}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Last Updated</Label>
                    <p className="text-slate-800 font-medium text-base">
                      {formatDateTime(selectedRequest.updatedAt).date} at{" "}
                      {formatDateTime(selectedRequest.updatedAt).time}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-slate-800">Description</Label>
                  <div className="p-6 bg-slate-50 rounded-xl border">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                      {selectedRequest.description}
                    </p>
                  </div>
                </div>

                {/* Sent Back Comment */}
                {selectedRequest.status.toLowerCase() === "sent back" && getSentBackComment(selectedRequest) && (
                  <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-l-4 border-orange-400">
                    <div className="flex items-center space-x-2 mb-3">
                      <ArrowLeft className="w-5 h-5 text-orange-600" />
                      <Label className="text-lg font-semibold text-orange-800">Sent Back Reason</Label>
                    </div>
                    <p className="text-orange-700 leading-relaxed">{getSentBackComment(selectedRequest)}</p>
                  </div>
                )}

                {/* Signature Display */}
                {selectedRequest.signatureProvided && selectedRequest.signatureData && (
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-l-4 border-emerald-400">
                    <div className="flex items-center space-x-2 mb-4">
                      <PenTool className="w-5 h-5 text-emerald-600" />
                      <Label className="text-lg font-semibold text-emerald-800">Digital Signature</Label>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-inner">
                      <img
                        src={selectedRequest.signatureData || "/placeholder.svg"}
                        alt="Digital Signature"
                        className="w-48 h-24 object-contain mx-auto"
                      />
                    </div>
                    {selectedRequest.signatureDate && (
                      <p className="text-sm text-emerald-600 mt-3 text-center">
                        Signed on {formatDateTime(selectedRequest.signatureDate).date} at{" "}
                        {formatDateTime(selectedRequest.signatureDate).time}
                      </p>
                    )}
                  </div>
                )}

                {/* Download PDF Button */}
                <div className="flex justify-center">
                  <PDFDownloadLink
                    document={<RequestPDF request={selectedRequest} />}
                    fileName={`request-${selectedRequest._id}.pdf`}
                  >
                    {({ loading }) => (
                      <Button
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4"
                      >
                        <Download className="w-5 h-5 mr-3" />
                        {loading ? "Generating PDF..." : "Download PDF Report"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>
            )}
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
