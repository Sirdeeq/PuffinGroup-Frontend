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
import { ArrowLeft, Send, Upload, X, FileText, AlertCircle, Loader2, Building2, Users } from "lucide-react"
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
    targetDepartments: [] as string[], // Changed to array
    assignedDirectors: "",
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

  // Fetch directors when departments change
  useEffect(() => {
    const fetchDirectors = async () => {
      if (formData.targetDepartments.length === 0) return

      try {
        setLoadingDirectors(true)
        // For multiple departments, we'll fetch directors from all selected departments
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

        // Remove duplicates based on _id
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
  }

  // Handle department selection
  const handleDepartmentToggle = (departmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetDepartments: prev.targetDepartments.includes(departmentId)
        ? prev.targetDepartments.filter((id) => id !== departmentId)
        : [...prev.targetDepartments, departmentId],
      // Reset director when departments change
      assignedDirectors: "",
    }))
  }

  // Select all departments
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
          description: `Your request "${formData.title}" has been submitted to ${formData.targetDepartments.length} department(s)`,
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

  const getSelectedDepartmentNames = () => {
    return formData.targetDepartments
      .map((id) => departments.find((dept) => dept._id === id))
      .filter(Boolean)
      .map((dept) => `${dept!.name} (${dept!.code})`)
      .join(", ")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/requests" className="inline-flex items-center text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Requests</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">Create New Request</h1>
          <p className="text-slate-600 mt-1">Submit a new request to the appropriate department(s)</p>
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

              {/* Multi-select Target Departments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>Target Departments *</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllDepartments}
                      disabled={loadingDepartments || isSubmitting}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      {formData.targetDepartments.length === departments.length ? "Deselect All" : "Select All"}
                    </Button>
                    <Badge variant="secondary" className="text-xs">
                      {formData.targetDepartments.length} selected
                    </Badge>
                  </div>
                </div>

                {loadingDepartments ? (
                  <div className="flex items-center justify-center p-8 border rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading departments...</span>
                  </div>
                ) : (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-4">
                      <ScrollArea className="h-48">
                        <div className="space-y-3">
                          {departments.map((dept) => (
                            <div
                              key={dept._id}
                              className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg"
                            >
                              <Checkbox
                                id={`dept-${dept._id}`}
                                checked={formData.targetDepartments.includes(dept._id)}
                                onCheckedChange={() => handleDepartmentToggle(dept._id)}
                                disabled={isSubmitting}
                              />
                              <div className="flex-1 min-w-0">
                                <Label
                                  htmlFor={`dept-${dept._id}`}
                                  className="text-sm font-medium cursor-pointer flex items-center space-x-2"
                                >
                                  <Building2 className="w-4 h-4 text-blue-600" />
                                  <span>{dept.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {dept.code}
                                  </Badge>
                                </Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {formData.targetDepartments.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <Label className="text-sm font-medium text-muted-foreground">Selected Departments:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.targetDepartments.map((deptId) => {
                              const dept = departments.find((d) => d._id === deptId)
                              return dept ? (
                                <Badge key={deptId} variant="secondary" className="text-xs">
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
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="director">Assigned Director (Optional)</Label>
                  <Select
                    value={formData.assignedDirectors}
                    onValueChange={(value) => handleInputChange("assignedDirectors", value)}
                    disabled={formData.targetDepartments.length === 0 || loadingDirectors}
                  >
                    <SelectTrigger>
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
                          {director.firstName} {director.lastName}
                          {director.position && (
                            <span className="text-sm text-muted-foreground ml-2">({director.position})</span>
                          )}
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
                  <p className="text-sm text-slate-500 mt-2">Supported formats: PDF, PNG, JPG (Max 10MB each)</p>
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
                  <Label className="text-sm font-medium text-slate-600">Target Departments</Label>
                  <div className="mt-1">
                    {formData.targetDepartments.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-slate-800 font-medium">
                          {formData.targetDepartments.length} department(s) selected
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {formData.targetDepartments.slice(0, 3).map((deptId) => {
                            const dept = departments.find((d) => d._id === deptId)
                            return dept ? (
                              <Badge key={deptId} variant="outline" className="text-xs">
                                {dept.code}
                              </Badge>
                            ) : null
                          })}
                          {formData.targetDepartments.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{formData.targetDepartments.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-800">Not selected</p>
                    )}
                  </div>
                </div>

                {formData.assignedDirectors && (
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Assigned Director</Label>
                    <p className="mt-1 text-slate-800">
                      {directors.find((d) => d._id === formData.assignedDirectors)
                        ? `${directors.find((d) => d._id === formData.assignedDirectors)?.firstName} ${
                            directors.find((d) => d._id === formData.assignedDirectors)?.lastName
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
                Submit to {formData.targetDepartments.length} Department
                {formData.targetDepartments.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
