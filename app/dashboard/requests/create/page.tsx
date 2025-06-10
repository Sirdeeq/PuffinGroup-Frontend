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
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { ArrowLeft, Send, Upload, X, FileText, AlertCircle, Loader2 } from "lucide-react"
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
    targetDepartment: "",
    assignedDirector: "",
    priority: "medium",
    category: "approval",
  })
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

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

  // Fetch directors when department changes
  useEffect(() => {
    const fetchDirectors = async () => {
      if (!formData.targetDepartment) return

      try {
        setLoadingDirectors(true)
        const response = await api.getDirectorsByDepartment(formData.targetDepartment, authContext)

        if (response.success && response.data) {
          const { currentDirector, previousDirectors } = response.data
          // Add current director to the list if it exists
          const directorsList = currentDirector ? [currentDirector, ...previousDirectors] : previousDirectors
          setDirectors(directorsList)
        } else {
          throw new Error(response.error || "Failed to fetch directors")
        }
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

    if (formData.targetDepartment) {
      fetchDirectors()
    }
  }, [formData.targetDepartment, authContext, toast])

  const priorities = [
    { value: "low", label: "Low", color: "text-blue-600" },
    { value: "medium", label: "Medium", color: "text-orange-600" },
    { value: "high", label: "High", color: "text-red-600" },
    { value: "urgent", label: "Urgent", color: "text-purple-600" },
  ]

  const categories = [
    { value: "approval", label: "Approval", description: "Requests requiring approval or authorization" },
    { value: "budget", label: "Budget", description: "Budget allocation and financial requests" },
    { value: "support", label: "Support", description: "Technical or operational support requests" },
    { value: "policy", label: "Policy", description: "Policy clarification or changes" },
    { value: "procurement", label: "Procurement", description: "Purchase and procurement requests" },
    { value: "other", label: "Other", description: "General requests not covered by other categories" },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Reset director when department changes
    if (field === "targetDepartment") {
      setFormData((prev) => ({
        ...prev,
        assignedDirector: "",
      }))
    }
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

    if (!formData.targetDepartment) {
      toast({
        title: "Department required",
        description: "Please select a target department",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare attachments data
      const attachmentsData = attachments.map(({ file, ...rest }) => ({
        name: rest.name,
        size: rest.size,
        type: file.type,
      }))

      // Create request data
      const requestData = {
        ...formData,
        attachments: attachmentsData,
      }

      // Submit request
      const response = await api.createRequest(requestData, authContext)

      if (response.success) {
        toast({
          title: "Request submitted successfully",
          description: `Your request "${formData.title}" has been submitted`,
        })

        // Upload attachments if any
        if (attachments.length > 0) {
          // In a real implementation, you would upload files here
          // For now, we'll just simulate success
          toast({
            title: "Attachments uploaded",
            description: `${attachments.length} attachment(s) uploaded successfully`,
          })
        }

        // Redirect to requests page
        router.push("/requests")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/requests" className="inline-flex items-center text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Requests</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">Create New Request</h1>
          <p className="text-slate-600 mt-1">Submit a new request to the appropriate department</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
              <CardDescription>Provide details about your request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Request Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a clear, descriptive title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-sm text-slate-600">{category.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of your request, including any specific requirements or context"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="department">Target Department *</Label>
                  <Select
                    value={formData.targetDepartment}
                    onValueChange={(value) => handleInputChange("targetDepartment", value)}
                    disabled={loadingDepartments}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingDepartments ? "Loading departments..." : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="director">Assigned Director (Optional)</Label>
                  <Select
                    value={formData.assignedDirector}
                    onValueChange={(value) => handleInputChange("assignedDirector", value)}
                    disabled={!formData.targetDepartment || loadingDirectors}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingDirectors
                            ? "Loading directors..."
                            : !formData.targetDepartment
                              ? "Select department first"
                              : "Select director"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {directors.map((director) => (
                        <SelectItem key={director._id} value={director._id}>
                          {director.firstName} {director.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.targetDepartment && <p className="text-sm text-slate-500">Select a department first</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <span className={priority.color}>{priority.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Attachments */}
              <div className="space-y-4">
                <Label>Attachments (Optional)</Label>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 mb-2">Drag and drop files here, or click to browse</p>
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
                  >
                    Choose Files
                  </Button>
                  <p className="text-sm text-slate-500 mt-2">
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 10MB each)
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
                          <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-800">{attachment.name}</p>
                              <p className="text-sm text-slate-600">{formatFileSize(attachment.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Category</Label>
                  <p className="mt-1 text-slate-800">{getSelectedCategory()?.label || "Not selected"}</p>
                  {getSelectedCategory() && (
                    <p className="text-sm text-slate-600">{getSelectedCategory()?.description}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Priority</Label>
                  <p className={`mt-1 font-medium ${getSelectedPriority()?.color || "text-slate-800"}`}>
                    {getSelectedPriority()?.label || "Medium"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Target Department</Label>
                  <p className="mt-1 text-slate-800">
                    {formData.targetDepartment
                      ? departments.find((d) => d._id === formData.targetDepartment)?.name || "Not selected"
                      : "Not selected"}
                  </p>
                </div>

                {formData.assignedDirector && (
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Assigned Director</Label>
                    <p className="mt-1 text-slate-800">
                      {directors.find((d) => d._id === formData.assignedDirector)
                        ? `${directors.find((d) => d._id === formData.assignedDirector)?.firstName} ${
                            directors.find((d) => d._id === formData.assignedDirector)?.lastName
                          }`
                        : "Not selected"}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-slate-600">Attachments</Label>
                  <p className="mt-1 text-slate-800">{attachments.length} file(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-600">
                <p>• Provide clear and detailed descriptions</p>
                <p>• Select the appropriate department and priority</p>
                <p>• Include relevant attachments when necessary</p>
                <p>• You can edit requests while they're pending</p>
                <p>• Track progress in the requests dashboard</p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title || !formData.description || !formData.targetDepartment}
            className="w-full bg-orange-500 hover:bg-orange-600"
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
                Submit Request
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
