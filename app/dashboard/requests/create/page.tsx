"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import {
  ArrowLeft,
  Send,
  Upload,
  X,
  FileText,
  AlertCircle,
  Loader2,
  Building2,
  Users,
  Calendar,
  User,
  Tag,
  Flag,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

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

interface FileAttachment {
  name: string
  size: number
  file: File
  id: string
}

export default function CreateRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const authContext = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [departments, setDepartments] = useState<Department[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [loadingDirectors, setLoadingDirectors] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetDepartments: [] as string[],
    assignedDirectors: "",
    priority: "medium",
    category: "approval",
    requiresSignature: false,
    dueDate: "",
  })
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

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
        }
    }
  }

  const themeColors = getThemeColor()

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
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
    fetchDepartments()
  }, [authContext, toast])

  // Fetch directors when departments change
  useEffect(() => {
    const fetchDirectors = async () => {
      if (formData.targetDepartments.length === 0) return
      try {
        setLoadingDirectors(true)
        const allDirectors: Director[] = []
        for (const deptId of formData.targetDepartments) {
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

    if (formData.targetDepartments.length > 0) {
      fetchDirectors()
    } else {
      setDirectors([])
    }
  }, [formData.targetDepartments, authContext, toast])

  const priorities = [
    { value: "low", label: "Low", color: "text-blue-600", bgColor: "bg-blue-100", icon: "🔵" },
    { value: "medium", label: "Medium", color: "text-orange-600", bgColor: "bg-orange-100", icon: "🟡" },
    { value: "high", label: "High", color: "text-red-600", bgColor: "bg-red-100", icon: "🔴" },
    { value: "urgent", label: "Urgent", color: "text-purple-600", bgColor: "bg-purple-100", icon: "🟣" },
  ]

  const categories = [
    { value: "it_support", label: "IT Support", description: "IT-related support and maintenance requests", icon: "💻" },
    { value: "hr_request", label: "HR Request", description: "Human resources and personnel-related requests", icon: "👥" },
    { value: "finance", label: "Finance", description: "Financial and accounting-related requests", icon: "💰" },
    { value: "procurement", label: "Procurement", description: "Purchase and procurement requests", icon: "🛒" },
    { value: "facilities", label: "Facilities", description: "Facilities management and maintenance requests", icon: "🏢" },
    { value: "legal", label: "Legal", description: "Legal and compliance-related requests", icon: "⚖️" },
    { value: "marketing", label: "Marketing", description: "Marketing and communications requests", icon: "📢" },
    { value: "operations", label: "Operations", description: "Operational and process-related requests", icon: "⚙️" },
    { value: "other", label: "Other", description: "General requests not covered by other categories", icon: "📝" }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDepartmentToggle = (departmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetDepartments: prev.targetDepartments.includes(departmentId)
        ? prev.targetDepartments.filter((id) => id !== departmentId)
        : [...prev.targetDepartments, departmentId],
      assignedDirectors: "",
    }))
  }

  const handleSelectAllDepartments = () => {
    const allDepartmentIds = departments.map((dept) => dept._id)
    setFormData((prev) => ({
      ...prev,
      targetDepartments: prev.targetDepartments.length === departments.length ? [] : allDepartmentIds,
      assignedDirectors: "",
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newAttachments = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        file: file,
        id: Math.random().toString(36).substr(2, 9),
      }))
      setAttachments((prev) => [...prev, ...newAttachments])

      // Simulate upload progress
      setUploadProgress(0)
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your request",
        variant: "destructive",
      })
      return
    }
    if (!formData.description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a description for your request",
        variant: "destructive",
      })
      return
    }
    if (formData.targetDepartments.length === 0) {
      toast({
        title: "Department required",
        description: "Please select at least one target department",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()

      // Add form fields
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("category", formData.category)
      formDataToSend.append("priority", formData.priority)
      formDataToSend.append("requiresSignature", formData.requiresSignature.toString())

      // Add target departments
      formData.targetDepartments.forEach((deptId) => {
        formDataToSend.append("targetDepartments", deptId)
      })

      // Add assigned director and department
      if (formData.assignedDirectors) {
        formDataToSend.append("assignedDirectors", formData.assignedDirectors)
        // Find the department of the assigned director
        const assignedDirector = directors.find((d) => d._id === formData.assignedDirectors)
        if (assignedDirector) {
          formDataToSend.append("department", assignedDirector.department)
        }
      }

      // Add due date if provided
      if (formData.dueDate) {
        formDataToSend.append("dueDate", formData.dueDate)
      }

      // Add attachments
      attachments.forEach((attachment) => {
        formDataToSend.append("attachments", attachment.file)
      })

      // Submit request
      const response = await api.createRequest(formDataToSend, authContext)

      if (response.success) {
        toast({
          title: "Request submitted successfully",
          description: `Your request "${formData.title}" has been submitted to ${formData.targetDepartments.length} department(s)`,
        })
        router.push("/dashboard/requests")
      } else {
        throw new Error(response.error || "Failed to submit request")
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedCategory = () => {
    return categories.find((cat) => cat.value === formData.category)
  }

  const getSelectedPriority = () => {
    return priorities.find((pri) => pri.value === formData.priority)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/dashboard/requests"
              className={`inline-flex items-center ${themeColors.text} hover:opacity-80 transition-opacity`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="text-sm sm:text-base">Back to Requests</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Create New Request</h1>
            <p className="text-slate-600 text-sm sm:text-base">Submit a new request to the appropriate department(s)</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className={`${themeColors.card} shadow-sm`}>
              <CardHeader className={`${themeColors.bg} rounded-t-lg`}>
                <CardTitle className={`flex items-center ${themeColors.text}`}>
                  <FileText className="w-5 h-5 mr-2" />
                  Request Information
                </CardTitle>
                <CardDescription>Provide details about your request</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Title and Category */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center text-sm font-medium">
                      <Tag className="w-4 h-4 mr-1" />
                      Request Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter a clear, descriptive title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className={`${themeColors.focus} transition-colors`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category *
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className={`${themeColors.focus}`}>
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

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of your request, including any specific requirements or context"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    className={`${themeColors.focus} transition-colors resize-none`}
                  />
                </div>

                {/* Priority and Due Date */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="flex items-center text-sm font-medium">
                      <Flag className="w-4 h-4 mr-1" />
                      Priority *
                    </Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                      <SelectTrigger className={`${themeColors.focus}`}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center space-x-2">
                              <span>{priority.icon}</span>
                              <span className={priority.color}>{priority.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="flex items-center text-sm font-medium">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due Date (Optional)
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange("dueDate", e.target.value)}
                      className={`${themeColors.focus} transition-colors`}
                    />
                  </div>
                </div>

                {/* Signature Requirement */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50">
                  <Checkbox
                    id="requires-signature"
                    checked={formData.requiresSignature}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, requiresSignature: checked as boolean }))
                    }
                    className={`${themeColors.accent}`}
                  />
                  <Label htmlFor="requires-signature" className="text-sm font-medium cursor-pointer">
                    Requires Digital Signature
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Department Selection */}
            <Card className={`${themeColors.card} shadow-sm`}>
              <CardHeader className={`${themeColors.bg} rounded-t-lg`}>
                <CardTitle className={`flex items-center justify-between ${themeColors.text}`}>
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Target Departments *
                  </div>
                  <Badge className={themeColors.badge}>{formData.targetDepartments.length} selected</Badge>
                </CardTitle>
                <CardDescription>Select the departments that should review this request</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllDepartments}
                      disabled={loadingDepartments || isSubmitting}
                      className={`${themeColors.buttonOutline} w-full sm:w-auto`}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      {formData.targetDepartments.length === departments.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

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
                              className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <Checkbox
                                id={`dept-${dept._id}`}
                                checked={formData.targetDepartments.includes(dept._id)}
                                onCheckedChange={() => handleDepartmentToggle(dept._id)}
                                disabled={isSubmitting}
                                className={`${themeColors.accent}`}
                              />
                              <div className="flex-1 min-w-0">
                                <Label
                                  htmlFor={`dept-${dept._id}`}
                                  className="text-sm font-medium cursor-pointer flex items-center space-x-2"
                                >
                                  <Building2 className={`w-4 h-4 ${themeColors.text}`} />
                                  <span className="truncate">{dept.name}</span>
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {dept.code}
                                  </Badge>
                                </Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {formData.targetDepartments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <Label className="text-sm font-medium text-muted-foreground">Selected Departments:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.targetDepartments.map((deptId) => {
                              const dept = departments.find((d) => d._id === deptId)
                              return dept ? (
                                <Badge key={deptId} className={`${themeColors.badgeSecondary} text-xs`}>
                                  {dept.name} ({dept.code})
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 ml-1 hover:bg-transparent"
                                    onClick={() => handleDepartmentToggle(deptId)}
                                    disabled={isSubmitting}
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
            <Card className={`${themeColors.card} shadow-sm`}>
              <CardHeader className={`${themeColors.bg} rounded-t-lg`}>
                <CardTitle className={`flex items-center ${themeColors.text}`}>
                  <User className="w-5 h-5 mr-2" />
                  Assigned Director (Optional)
                </CardTitle>
                <CardDescription>Assign a specific director to handle this request</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <Select
                    value={formData.assignedDirectors}
                    onValueChange={(value) => handleInputChange("assignedDirectors", value)}
                    disabled={formData.targetDepartments.length === 0 || loadingDirectors}
                  >
                    <SelectTrigger className={`${themeColors.focus}`}>
                      <SelectValue
                        placeholder={
                          loadingDirectors
                            ? "Loading directors..."
                            : formData.targetDepartments.length === 0
                              ? "Select departments first"
                              : "Select director"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {directors.map((director) => (
                        <SelectItem key={director._id} value={director._id}>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <div>
                              <div>
                                {director.firstName} {director.lastName}
                              </div>
                              {director.position && (
                                <div className="text-xs text-muted-foreground">({director.position})</div>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.targetDepartments.length === 0 && (
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
            <Card className={`${themeColors.card} shadow-sm`}>
              <CardHeader className={`${themeColors.bg} rounded-t-lg`}>
                <CardTitle className={`flex items-center ${themeColors.text}`}>
                  <Upload className="w-5 h-5 mr-2" />
                  Attachments (Optional)
                </CardTitle>
                <CardDescription>Upload relevant documents and files</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed ${themeColors.border} rounded-lg p-6 text-center hover:border-opacity-60 transition-colors`}
                >
                  <Upload className={`w-8 h-8 ${themeColors.text} mx-auto mb-2`} />
                  <p className="text-slate-600 mb-2 text-sm sm:text-base">
                    Drag and drop files here, or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    disabled={isSubmitting}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={isSubmitting}
                    className={`${themeColors.buttonOutline}`}
                  >
                    Choose Files
                  </Button>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">
                    Supported formats: PDF, PNG, JPG (Max 10MB each)
                  </p>
                </div>

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Attached Files */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Attached Files ({attachments.length})</Label>
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-800 truncate text-sm">{attachment.name}</p>
                              <p className="text-xs text-slate-600">{formatFileSize(attachment.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-red-600 hover:text-red-800 shrink-0"
                            disabled={isSubmitting}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Summary */}
            <Card className={`${themeColors.card} shadow-sm`}>
              <CardHeader className={`${themeColors.bg} rounded-t-lg`}>
                <CardTitle className={themeColors.text}>Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Category</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <span>{getSelectedCategory()?.icon}</span>
                      <span className="text-slate-800 font-medium">
                        {getSelectedCategory()?.label || "Not selected"}
                      </span>
                    </div>
                    {getSelectedCategory() && (
                      <p className="text-xs text-slate-600 mt-1">{getSelectedCategory()?.description}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Priority</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <span>{getSelectedPriority()?.icon}</span>
                      <span className={`font-medium ${getSelectedPriority()?.color || "text-slate-800"}`}>
                        {getSelectedPriority()?.label || "Medium"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Target Departments
                    </Label>
                    <div className="mt-1">
                      {formData.targetDepartments.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-slate-800 font-medium text-sm">
                            {formData.targetDepartments.length} department(s) selected
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {formData.targetDepartments.slice(0, 3).map((deptId) => {
                              const dept = departments.find((d) => d._id === deptId)
                              return dept ? (
                                <Badge key={deptId} className={`${themeColors.badgeSecondary} text-xs`}>
                                  {dept.code}
                                </Badge>
                              ) : null
                            })}
                            {formData.targetDepartments.length > 3 && (
                              <Badge className={`${themeColors.badgeSecondary} text-xs`}>
                                +{formData.targetDepartments.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 text-sm">Not selected</p>
                      )}
                    </div>
                  </div>

                  {formData.assignedDirectors && (
                    <div>
                      <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Assigned Director
                      </Label>
                      <p className="mt-1 text-slate-800 text-sm">
                        {directors.find((d) => d._id === formData.assignedDirectors)
                          ? `${directors.find((d) => d._id === formData.assignedDirectors)?.firstName} ${directors.find((d) => d._id === formData.assignedDirectors)?.lastName}`
                          : "Not selected"}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Signature Required
                    </Label>
                    <p className="mt-1 text-slate-800 text-sm">{formData.requiresSignature ? "✅ Yes" : "❌ No"}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Attachments</Label>
                    <p className="mt-1 text-slate-800 text-sm">{attachments.length} file(s)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <p>• Provide clear and detailed descriptions</p>
                  <p>• Select appropriate departments and priority</p>
                  <p>• Include relevant attachments when necessary</p>
                  <p>• You can edit requests while they're pending</p>
                  <p>• Track progress in the requests dashboard</p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting || !formData.title || !formData.description || formData.targetDepartments.length === 0
              }
              className={`w-full ${themeColors.primary} ${themeColors.primaryHover} text-white shadow-lg`}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit to {formData.targetDepartments.length} Department
                  {formData.targetDepartments.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
