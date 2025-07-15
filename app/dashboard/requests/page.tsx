"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
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
  Building2,
  Send,
  X,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from "@react-pdf/renderer"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"

// Add these interfaces near your other interfaces
interface Department {
  _id: string
  name: string
  code: string
  isActive: boolean
}

interface Director {
  _id: string
  firstName: string
  lastName: string
  email: string
  position: string
  department: string
}

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
// Enhanced color scheme
const colors = {
  primary: "#1e40af",
  secondary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
}

const statusColors = {
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.danger,
  "sent back": colors.gray[500],
  "in review": colors.secondary,
}

const priorityColors = {
  low: colors.gray[400],
  medium: colors.warning,
  high: colors.danger,
  urgent: "#dc2626",
}

// Enhanced PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    position: "relative",
    lineHeight: 1.4,
  },

  // Header Section
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },

  logoSection: {
    alignItems: "flex-end",
    width: 120,
  },

  logo: {
    width: 70,
    height: 35,
    marginBottom: 5,
  },

  companyName: {
    fontSize: 8,
    color: colors.gray[600],
    fontWeight: "bold",
  },

  titleSection: {
    flex: 1,
    paddingRight: 20,
  },

  documentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 5,
  },

  documentSubtitle: {
    fontSize: 10,
    color: colors.gray[600],
    marginBottom: 10,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Badge Styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    minWidth: 60,
  },

  // Request Info Section
  requestInfoContainer: {
    backgroundColor: colors.gray[50],
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  requestTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[900],
    marginBottom: 8,
  },

  requestMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaLabel: {
    fontSize: 9,
    color: colors.gray[600],
    marginRight: 5,
    fontWeight: "bold",
  },

  metaValue: {
    fontSize: 9,
    color: colors.gray[800],
  },

  // Main Content Layout
  contentContainer: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },

  leftColumn: {
    flex: 1.2,
  },

  rightColumn: {
    flex: 0.8,
  },

  // Section Styles
  section: {
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primary,
    flex: 1,
  },

  sectionCount: {
    fontSize: 8,
    color: colors.gray[500],
    backgroundColor: colors.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },

  // Description
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.gray[700],
    textAlign: "justify",
  },

  // Info Rows
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-start",
  },

  infoLabel: {
    fontWeight: "bold",
    width: 70,
    marginRight: 8,
    color: colors.gray[600],
    fontSize: 9,
  },

  infoValue: {
    flex: 1,
    fontSize: 9,
    color: colors.gray[800],
  },

  // Department List
  departmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },

  departmentChip: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },

  departmentText: {
    fontSize: 8,
    color: colors.gray[700],
  },

  // Status Summary
  statusGrid: {
    gap: 8,
  },

  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },

  statusText: {
    fontSize: 9,
    flex: 1,
  },

  statusValue: {
    fontSize: 8,
    fontWeight: "bold",
  },

  // Signature Section
  signatureSection: {
    backgroundColor: colors.success + "10",
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },

  signatureTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.success,
    marginBottom: 8,
  },

  signatureStatus: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },

  signatureImage: {
    width: 100,
    height: 50,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 4,
  },

  // Comment Box
  commentBox: {
    backgroundColor: colors.warning + "20",
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },

  commentTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.warning,
    marginBottom: 5,
  },

  commentText: {
    fontSize: 9,
    color: colors.gray[700],
    lineHeight: 1.4,
  },

  // Attachments Table
  attachmentTable: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 4,
    overflow: "hidden",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray[200],
  },

  tableCell: {
    padding: 8,
    flex: 1,
    fontSize: 8,
  },

  tableCellHeader: {
    padding: 8,
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    color: colors.gray[700],
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  footerText: {
    fontSize: 8,
    color: colors.gray[500],
  },

  // Watermark
  watermark: {
    position: "absolute",
    top: "45%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-30deg)",
    fontSize: 80,
    opacity: 0.05,
    zIndex: -1,
    fontWeight: "bold",
    color: colors.gray[400],
  },
})

// Enhanced PDF Component
const RequestPDF = ({ request }: { request: any }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getBadge = (text: string, type: "status" | "priority") => {
    const colorMap = type === "status" ? statusColors : priorityColors
    const color = colorMap[text.toLowerCase()] || colors.gray[500]

    return (
      <View style={[pdfStyles.badge, { backgroundColor: color }]}>
        <Text>{text.toUpperCase()}</Text>
      </View>
    )
  }

  const getSentBackComment = () => {
    const sentBackAction = request.actionHistory?.find((action: any) => action.action === "sent_back")
    return sentBackAction?.comment || ""
  }

  // Remove duplicate directors and group by unique director info
  const uniqueDirectors =
    request.assignedDirectors?.reduce((acc: any[], director: any) => {
      const existing = acc.find(
        (d) =>
          d.director?._id === director.director?._id ||
          (d.director?.firstName === director.director?.firstName &&
            d.director?.lastName === director.director?.lastName),
      )
      if (!existing) {
        acc.push(director)
      }
      return acc
    }, []) || []

  // Group department approvals by status to avoid repetition
  const groupedApprovals =
    request.departmentApprovals?.reduce((acc: any, approval: any) => {
      const status = approval.status
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(approval.department.name)
      return acc
    }, {}) || {}

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Watermark */}
        <Text style={pdfStyles.watermark}>{request.status.toUpperCase()}</Text>

        {/* Header */}
        <View style={pdfStyles.headerContainer}>
          <View style={pdfStyles.titleSection}>
            <Text style={pdfStyles.documentTitle}>REQUEST DETAILS</Text>
            <Text style={pdfStyles.documentSubtitle}>
              Generated on {new Date().toLocaleDateString()} • ID: {request._id?.slice(-8).toUpperCase()}
            </Text>
            <View style={pdfStyles.statusContainer}>
              {getBadge(request.status, "status")}
              {request.isUrgent && getBadge("urgent", "priority")}
            </View>
          </View>

          <View style={pdfStyles.logoSection}>
            <Image style={pdfStyles.logo} src="/logo.png?height=35&width=70" />
            <Text style={pdfStyles.companyName}>PUFFIN GROUP</Text>
          </View>
        </View>

        {/* Request Info */}
        <View style={pdfStyles.requestInfoContainer}>
          <Text style={pdfStyles.requestTitle}>{request.title}</Text>
          <View style={pdfStyles.requestMeta}>
            <View style={pdfStyles.metaItem}>
              <Text style={pdfStyles.metaLabel}>Created by:</Text>
              <Text style={pdfStyles.metaValue}>
                {request.createdBy?.firstName} {request.createdBy?.lastName}
              </Text>
            </View>
            <View style={pdfStyles.metaItem}>
              <Text style={pdfStyles.metaLabel}>Priority:</Text>
              <Text style={pdfStyles.metaValue}>{request.priority?.toUpperCase()}</Text>
            </View>
            <View style={pdfStyles.metaItem}>
              <Text style={pdfStyles.metaLabel}>Category:</Text>
              <Text style={pdfStyles.metaValue}>{request.category?.replace("_", " ").toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={pdfStyles.contentContainer}>
          {/* Left Column */}
          <View style={pdfStyles.leftColumn}>
            {/* Description */}
            <View style={pdfStyles.section}>
              <View style={pdfStyles.sectionHeader}>
                <Text style={pdfStyles.sectionTitle}>DESCRIPTION</Text>
              </View>
              <Text style={pdfStyles.description}>{request.description}</Text>
            </View>

            {/* Timeline */}
            <View style={pdfStyles.section}>
              <View style={pdfStyles.sectionHeader}>
                <Text style={pdfStyles.sectionTitle}>TIMELINE</Text>
              </View>
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Created:</Text>
                <Text style={pdfStyles.infoValue}>{formatDate(request.createdAt)}</Text>
              </View>
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Updated:</Text>
                <Text style={pdfStyles.infoValue}>{formatDate(request.updatedAt)}</Text>
              </View>
              {request.dueDate && (
                <View style={pdfStyles.infoRow}>
                  <Text style={pdfStyles.infoLabel}>Due Date:</Text>
                  <Text style={pdfStyles.infoValue}>{formatDate(request.dueDate)}</Text>
                </View>
              )}
            </View>

            {/* Target Departments */}
            <View style={pdfStyles.section}>
              <View style={pdfStyles.sectionHeader}>
                <Text style={pdfStyles.sectionTitle}>TARGET DEPARTMENTS</Text>
                <Text style={pdfStyles.sectionCount}>{request.targetDepartments?.length || 0}</Text>
              </View>
              <View style={pdfStyles.departmentGrid}>
                {request.targetDepartments?.map((dept: any) => (
                  <View key={dept._id} style={pdfStyles.departmentChip}>
                    <Text style={pdfStyles.departmentText}>{dept.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={pdfStyles.rightColumn}>
            {/* Status Summary */}
            <View style={pdfStyles.section}>
              <View style={pdfStyles.sectionHeader}>
                <Text style={pdfStyles.sectionTitle}>APPROVAL STATUS</Text>
              </View>
              <View style={pdfStyles.statusGrid}>
                {Object.entries(groupedApprovals).map(([status, departments]: [string, any]) => (
                  <View key={status} style={pdfStyles.statusItem}>
                    <View
                      style={[
                        pdfStyles.statusDot,
                        { backgroundColor: statusColors[status.toLowerCase()] || colors.gray[400] },
                      ]}
                    />
                    <Text style={pdfStyles.statusText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                    <Text style={pdfStyles.statusValue}>({departments.length})</Text>
                  </View>
                ))}
              </View>

              {/* Directors */}
              {uniqueDirectors.length > 0 && (
                <>
                  <Text style={[pdfStyles.sectionTitle, { marginTop: 10, marginBottom: 5, fontSize: 9 }]}>
                    DIRECTORS
                  </Text>
                  {uniqueDirectors.map((director: any, index: number) => (
                    <View key={index} style={pdfStyles.statusItem}>
                      <View
                        style={[
                          pdfStyles.statusDot,
                          { backgroundColor: statusColors[director.status?.toLowerCase()] || colors.gray[400] },
                        ]}
                      />
                      <Text style={pdfStyles.statusText}>
                        {director.director
                          ? `${director.director.firstName} ${director.director.lastName}`
                          : "Director"}
                      </Text>
                      <Text style={pdfStyles.statusValue}>{director.status}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            {/* Digital Signature */}
            {request.requiresSignature && (
              <View style={pdfStyles.signatureSection}>
                <Text style={pdfStyles.signatureTitle}>DIGITAL SIGNATURE</Text>
                <Text
                  style={[
                    pdfStyles.signatureStatus,
                    { color: request.signatureProvided ? colors.success : colors.danger },
                  ]}
                >
                  {request.signatureProvided ? "SIGNED" : "PENDING"}
                </Text>
                {request.signatureProvided && request.signatureDate && (
                  <Text style={pdfStyles.metaValue}>Signed on {formatDate(request.signatureDate)}</Text>
                )}
                {request.signatureData && (
                  <Image style={pdfStyles.signatureImage} src={request.signatureData || "/placeholder.svg"} />
                )}
              </View>
            )}

            {/* Sent Back Comment */}
            {request.status.toLowerCase() === "sent back" && getSentBackComment() && (
              <View style={pdfStyles.commentBox}>
                <Text style={pdfStyles.commentTitle}>FEEDBACK</Text>
                <Text style={pdfStyles.commentText}>{getSentBackComment()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Attachments */}
        {request.attachments?.length > 0 && (
          <View style={pdfStyles.section}>
            <View style={pdfStyles.sectionHeader}>
              <Text style={pdfStyles.sectionTitle}>ATTACHMENTS</Text>
              <Text style={pdfStyles.sectionCount}>{request.attachments.length}</Text>
            </View>
            <View style={pdfStyles.attachmentTable}>
              <View style={pdfStyles.tableHeader}>
                <Text style={pdfStyles.tableCellHeader}>File Name</Text>
                <Text style={pdfStyles.tableCellHeader}>Type</Text>
                <Text style={pdfStyles.tableCellHeader}>Size</Text>
              </View>
              {request.attachments.map((file: any, index: number) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>{file.name}</Text>
                  <Text style={pdfStyles.tableCell}>{file.type}</Text>
                  <Text style={pdfStyles.tableCell}>{(file.size / 1024).toFixed(1)} KB</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>Puffin Group Request Management System</Text>
          <Text style={pdfStyles.footerText}>Confidential Document</Text>
        </View>
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
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [directors, setDirectors] = useState<Director[]>([])
  const [loadingDirectors, setLoadingDirectors] = useState(false)
  const [editRequest, setEditRequest] = useState<RequestItem | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newAttachments, setNewAttachments] = useState<File[]>([])

  // Fetch departments when edit dialog opens
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!editRequest) return

      try {
        setLoadingDepartments(true)
        const response = await api.getDepartments({ includeInactive: false }, authContext)
        if (response.success && response.data) {
          setDepartments(response.data.departments || [])
        } else {
          throw new Error(response.error || "Failed to fetch departments")
        }
      } catch (error: any) {
        console.error("Error fetching departments:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load departments",
          variant: "destructive",
        })
      } finally {
        setLoadingDepartments(false)
      }
    }

    if (editRequest) {
      fetchDepartments()
    } else {
      setDepartments([])
    }
  }, [editRequest, authContext, toast])

  // Fetch directors when departments change in edit mode
  useEffect(() => {
    const fetchDirectors = async () => {
      if (!editRequest || !editRequest.targetDepartments) {
        setDirectors([])
        return
      }

      try {
        setLoadingDirectors(true)
        const allDirectors: Director[] = []

        for (const deptId of editRequest.targetDepartments) {
          try {
            const response = await api.getDirectorsByDepartment(deptId, authContext)
            if (response.success && response.data) {
              const { currentDirector, previousDirectors } = response.data
              if (currentDirector) allDirectors.push(currentDirector)
              allDirectors.push(...previousDirectors)
            }
          } catch (error) {
            console.error(`Error fetching directors for department ${deptId}:`, error)
          }
        }

        const uniqueDirectors = allDirectors.filter(
          (director, index, self) => index === self.findIndex((d) => d._id === director._id),
        )
        setDirectors(uniqueDirectors)
      } catch (error: any) {
        console.error("Error fetching directors:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load directors",
          variant: "destructive",
        })
      } finally {
        setLoadingDirectors(false)
      }
    }

    if (editRequest && editRequest.targetDepartments.length > 0) {
      fetchDirectors()
    } else {
      setDirectors([])
    }
  }, [editRequest?.targetDepartments, authContext, toast])

  // Function to handle file uploads for editing
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setNewAttachments(Array.from(event.target.files))
    }
  }

  // Function to update the request
  const handleUpdateRequest = async () => {
    if (!editRequest) return
    setIsUpdating(true)
    try {
      const formData = new FormData()
      formData.append("title", editRequest.title)
      formData.append("description", editRequest.description)
      formData.append("category", editRequest.category)
      formData.append("priority", editRequest.priority)
      formData.append("requiresSignature", editRequest.requiresSignature?.toString() || "false")

      // Add target departments
      editRequest.targetDepartments.forEach((deptId) => {
        formData.append("targetDepartments", deptId)
      })

      // Add assigned director if selected
      if (editRequest.assignedDirectors) {
        formData.append("assignedDirectors", editRequest.assignedDirectors)
      }

      // Add due date if provided
      if (editRequest.dueDate) {
        formData.append("dueDate", editRequest.dueDate)
      }

      // Add new attachments
      newAttachments.forEach((file) => {
        formData.append("attachments", file)
      })

      // Add existing attachments that haven't been removed
      editRequest.attachments.forEach((attachment) => {
        formData.append("existingAttachments", attachment.name)
      })

      const response = await api.updateRequest(editRequest._id, formData, authContext)
      if (response.success) {
        toast({
          title: "Request updated successfully",
          description: `Your request "${editRequest.title}" has been updated`,
        })
        // Refresh the requests list
        const refreshResponse = await api.getRequests(authContext)
        if (refreshResponse.success && refreshResponse.data) {
          setRequests(refreshResponse.data.requests || [])
        }
        setEditRequest(null)
        setNewAttachments([])
      } else {
        throw new Error(response.error || "Failed to update request")
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update request",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle edit button click
  const handleEditClick = (request: RequestItem) => {
    // Properly extract director ID from the request structure
    const assignedDirectorId =
      request.assignedDirectors.length > 0 && request.assignedDirectors[0].director
        ? request.assignedDirectors[0].director._id
        : ""

    setEditRequest({
      ...request,
      // Convert department objects to just IDs for the form
      targetDepartments: request.targetDepartments.map((dept) => dept._id),
      // Extract director ID properly
      assignedDirectors: assignedDirectorId,
    })
    setNewAttachments([])
  }

  const priorities = [
    { value: "low", label: "Low", color: "text-blue-600", bgColor: "bg-blue-100", icon: "🔵" },
    { value: "medium", label: "Medium", color: "text-orange-600", bgColor: "bg-orange-100", icon: "🟡" },
    { value: "high", label: "High", color: "text-red-600", bgColor: "bg-red-100", icon: "🔴" },
    { value: "urgent", label: "Urgent", color: "text-purple-600", bgColor: "bg-purple-100", icon: "🟣" },
  ]

  const categories = [
    {
      value: "it_support",
      label: "IT Support",
      description: "IT-related support and maintenance requests",
      icon: "💻",
    },
    {
      value: "hr_request",
      label: "HR Request",
      description: "Human resources and personnel-related requests",
      icon: "👥",
    },
    { value: "finance", label: "Finance", description: "Financial and accounting-related requests", icon: "💰" },
    { value: "procurement", label: "Procurement", description: "Purchase and procurement requests", icon: "🛒" },
    {
      value: "facilities",
      label: "Facilities",
      description: "Facilities management and maintenance requests",
      icon: "🏢",
    },
    { value: "legal", label: "Legal", description: "Legal and compliance-related requests", icon: "⚖️" },
    { value: "marketing", label: "Marketing", description: "Marketing and communications requests", icon: "📢" },
    { value: "operations", label: "Operations", description: "Operational and process-related requests", icon: "⚙️" },
    { value: "other", label: "Other", description: "General requests not covered by other categories", icon: "📝" },
  ]

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
                <DropdownMenuItem onClick={() => handleEditClick(request)} className="text-base py-3">
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
                      <DropdownMenuItem onClick={() => handleEditClick(request)} className="text-base py-3">
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

        {/* Edit Request Dialog */}
        <Dialog open={!!editRequest} onOpenChange={() => setEditRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Edit className="w-6 h-6" />
                Edit Request
              </DialogTitle>
              <DialogDescription>Update the details of this request</DialogDescription>
            </DialogHeader>
            {editRequest && (
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader className="bg-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center text-blue-600">
                      <FileText className="w-5 h-5 mr-2" />
                      Request Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Request Title *</Label>
                        <Input
                          id="edit-title"
                          value={editRequest.title}
                          onChange={(e) => setEditRequest({ ...editRequest, title: e.target.value })}
                          placeholder="Enter a clear, descriptive title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select
                          value={editRequest.category}
                          onValueChange={(value) => setEditRequest({ ...editRequest, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center space-x-2">
                                  <span>{category.icon}</span>
                                  <div>
                                    <div className="font-medium">{category.label}</div>
                                    <div className="text-xs text-slate-600 hidden sm:block">{category.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={editRequest.description}
                        onChange={(e) => setEditRequest({ ...editRequest, description: e.target.value })}
                        placeholder="Provide a detailed description"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Priority *</Label>
                        <Select
                          value={editRequest.priority}
                          onValueChange={(value) => setEditRequest({ ...editRequest, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                <div className="flex items-center space-x-2">
                                  <span>{priority.icon}</span>
                                  <span>{priority.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date (Optional)</Label>
                        <Input
                          type="date"
                          value={editRequest.dueDate ? editRequest.dueDate.split("T")[0] : ""}
                          onChange={(e) => setEditRequest({ ...editRequest, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50">
                      <Checkbox
                        id="edit-requires-signature"
                        checked={editRequest.requiresSignature}
                        onCheckedChange={(checked) =>
                          setEditRequest({ ...editRequest, requiresSignature: checked as boolean })
                        }
                      />
                      <Label htmlFor="edit-requires-signature">Requires Digital Signature</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Department Selection */}
                <Card>
                  <CardHeader className="bg-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between text-blue-600">
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 mr-2" />
                        Target Departments *
                      </div>
                      <Badge>{editRequest.targetDepartments.length} selected</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allIds = departments.map((d) => d._id)
                          setEditRequest({
                            ...editRequest,
                            targetDepartments: editRequest.targetDepartments.length === allIds.length ? [] : allIds,
                            assignedDirectors: "",
                          })
                        }}
                        disabled={loadingDepartments}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        {editRequest.targetDepartments.length === departments.length ? "Deselect All" : "Select All"}
                      </Button>

                      {loadingDepartments ? (
                        <div className="flex items-center justify-center p-8 border rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading departments...</span>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <ScrollArea className="h-48">
                            <div className="space-y-2">
                              {departments.map((dept) => (
                                <div
                                  key={dept._id}
                                  className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg"
                                >
                                  <Checkbox
                                    id={`edit-dept-${dept._id}`}
                                    checked={editRequest.targetDepartments.includes(dept._id)}
                                    onCheckedChange={() => {
                                      const newDepts = editRequest.targetDepartments.includes(dept._id)
                                        ? editRequest.targetDepartments.filter((id) => id !== dept._id)
                                        : [...editRequest.targetDepartments, dept._id]
                                      setEditRequest({
                                        ...editRequest,
                                        targetDepartments: newDepts,
                                        assignedDirectors: "",
                                      })
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <Label htmlFor={`edit-dept-${dept._id}`} className="flex items-center space-x-2">
                                      <Building2 className="w-4 h-4" />
                                      <span className="truncate">{dept.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {dept.code}
                                      </Badge>
                                    </Label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          {editRequest.targetDepartments.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <Label>Selected Departments:</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {editRequest.targetDepartments.map((deptId) => {
                                  const dept = departments.find((d) => d._id === deptId)
                                  return dept ? (
                                    <Badge key={deptId} variant="secondary" className="text-xs">
                                      {dept.name} ({dept.code})
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 ml-1"
                                        onClick={() => {
                                          setEditRequest({
                                            ...editRequest,
                                            targetDepartments: editRequest.targetDepartments.filter(
                                              (id) => id !== deptId,
                                            ),
                                            assignedDirectors: "",
                                          })
                                        }}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </Badge>
                                  ) : null
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Director Assignment */}
                <Card>
                  <CardHeader className="bg-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center text-blue-600">
                      <User className="w-5 h-5 mr-2" />
                      Assigned Director (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <Select
                        value={editRequest.assignedDirectors}
                        onValueChange={(value) => setEditRequest({ ...editRequest, assignedDirectors: value })}
                        disabled={editRequest.targetDepartments.length === 0 || loadingDirectors}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingDirectors
                                ? "Loading directors..."
                                : editRequest.targetDepartments.length === 0
                                  ? "Select departments first"
                                  : "Select director"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {directors
                            .filter((d) => editRequest.targetDepartments.includes(d.department))
                            .map((director) => (
                              <SelectItem key={director._id} value={director._id}>
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4" />
                                  <div>
                                    <div>
                                      {director.firstName} {director.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">({director.position})</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {editRequest.targetDepartments.length === 0 && (
                        <p className="text-sm text-slate-500">Select departments first</p>
                      )}
                      {directors.length > 0 && (
                        <p className="text-sm text-slate-500">
                          {directors.length} director(s) available from selected departments
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* File Attachments */}
                <Card>
                  <CardHeader className="bg-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center text-blue-600">
                      <Upload className="w-5 h-5 mr-2" />
                      Attachments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-slate-600 mb-2">Drag and drop files here, or click to browse</p>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="edit-file-upload"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      />
                      <Button variant="outline" onClick={() => document.getElementById("edit-file-upload")?.click()}>
                        Choose Files
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">Supported formats: PDF, PNG, JPG (Max 10MB each)</p>
                    </div>
                    {editRequest.attachments.length > 0 && (
                      <div className="space-y-2">
                        <Label>Current Attachments ({editRequest.attachments.length})</Label>
                        <div className="space-y-2">
                          {editRequest.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-800 truncate">{attachment.name}</p>
                                  <p className="text-xs text-slate-600">{(attachment.size / 1024).toFixed(2)} KB</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditRequest({
                                    ...editRequest,
                                    attachments: editRequest.attachments.filter((_, i) => i !== index),
                                  })
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {newAttachments.length > 0 && (
                      <div className="space-y-2">
                        <Label>New Attachments ({newAttachments.length})</Label>
                        <div className="space-y-2">
                          {newAttachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <FileText className="w-4 h-4 text-green-600" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-800 truncate">{file.name}</p>
                                  <p className="text-xs text-slate-600">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setNewAttachments(newAttachments.filter((_, i) => i !== index))
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditRequest(null)
                      setNewAttachments([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateRequest}
                    disabled={
                      isUpdating ||
                      !editRequest.title ||
                      !editRequest.description ||
                      editRequest.targetDepartments.length === 0
                    }
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Update Request
                      </>
                    )}
                  </Button>
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
