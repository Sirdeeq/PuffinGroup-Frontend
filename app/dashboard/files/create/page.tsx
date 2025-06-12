"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { Upload, FileText, X, Save, Send, ImageIcon, Video, Loader2, AlertCircle, Building2, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Department {
  _id: string
  name: string
  code: string
  isActive: boolean
}

export default function CreateFilePage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    departments: [] as string[], // Changed to array for multi-select
    description: "",
    category: "document",
    priority: "medium",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authContext.loading && !authContext.isAuthenticated) {
      router.push("/login")
    }
  }, [authContext.isAuthenticated, authContext.loading, router])

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true)
        const response = await api.getDepartments({ includeInactive: false }, authContext)

        if (response.success && response.data) {
          setDepartments(response.data.departments || [])
        }
      } catch (error) {
        console.error("Error fetching departments:", error)
        toast({
          title: "Error",
          description: "Failed to load departments",
          variant: "destructive",
        })
      } finally {
        setLoadingDepartments(false)
      }
    }

    if (authContext.isAuthenticated) {
      fetchDepartments()
    }
  }, [authContext, toast])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid file type (JPG, PNG, PDF, DOC, DOCX, XLS, XLSX)",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setError(null)
    toast({
      title: "File selected",
      description: `${file.name} is ready for upload`,
    })
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setError(null)
    // Reset file input
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  // Handle department selection
  const handleDepartmentToggle = (departmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.includes(departmentId)
        ? prev.departments.filter((id) => id !== departmentId)
        : [...prev.departments, departmentId],
    }))
  }

  // Select all departments
  const handleSelectAllDepartments = () => {
    const allDepartmentIds = departments.map((dept) => dept._id)
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.length === departments.length ? [] : allDepartmentIds,
    }))
  }

  const handleSubmit = async (action: "draft" | "submit") => {
    if (!formData.title || formData.departments.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and select at least one department",
        variant: "destructive",
      })
      return
    }

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()

      // Add file metadata
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("category", formData.category)
      formDataToSend.append("priority", formData.priority)

      formDataToSend.append("status", action === "draft" ? "draft" : "pending")

      // Add multiple departments as an array
      const departmentArray = Array.isArray(formData.departments) ? formData.departments : []
      if (departmentArray.length > 0) {
        // Send as JSON string since we need to maintain array format
        formDataToSend.append("departments", JSON.stringify(departmentArray))
      } else {
        throw new Error("No departments selected")
      }

      // Add the file (controller expects field name 'file')
      formDataToSend.append("file", selectedFile)

      // Log FormData contents for debugging
      console.log("Uploading file:", {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        title: formData.title,
        departments: formData.departments,
      })

      // Simulate upload progress
      setIsUploading(true)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Upload file using API
      const response = await api.uploadFile(formDataToSend, authContext)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.success) {
        toast({
          title: action === "draft" ? "Draft saved" : "File submitted",
          description:
            action === "draft"
              ? "File saved as draft"
              : `File submitted successfully to ${formData.departments.length} department(s)`,
        })

        // Reset form
        setFormData({
          title: "",
          departments: [],
          description: "",
          category: "document",
          priority: "medium",
        })
        setSelectedFile(null)
        setUploadProgress(0)

        // Redirect to files page
        setTimeout(() => {
          router.push("/dashboard/files")
        }, 1000)
      } else {
        throw new Error(response.error || "Failed to submit file")
      }
    } catch (error: any) {
      console.error("File upload error:", error)

      let errorMessage = "Failed to submit file"

      // Handle specific Cloudinary errors
      if (error.message?.includes("Invalid Signature")) {
        errorMessage = "Cloudinary configuration error. Please check your API credentials."
        setError("There's an issue with the file upload service configuration. Please contact your administrator.")
      } else if (error.message?.includes("Invalid")) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })

      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return ImageIcon
    if (file.type.startsWith("video/")) return Video
    return FileText
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Show loading if auth is loading
  if (authContext.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Create New File</h1>
        <p className="text-slate-600 mt-1">Create and submit a new file for processing</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-500" />
            File Details
          </CardTitle>
          <CardDescription>Fill in the details for your new file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">File Title *</Label>
              <Input
                id="title"
                placeholder="Enter file title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Multi-select Departments */}
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
                  {formData.departments.length === departments.length ? "Deselect All" : "Select All"}
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {formData.departments.length} selected
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
                        <div key={dept._id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg">
                          <Checkbox
                            id={`dept-${dept._id}`}
                            checked={formData.departments.includes(dept._id)}
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
                  {formData.departments.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-sm font-medium text-muted-foreground">Selected Departments:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.departments.map((deptId) => {
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
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose and content of this file"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <Label>File Upload</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-slate-600 mb-2">Select a file to upload</p>
              <p className="text-sm text-slate-500 mb-4">Supports: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX (Max 10MB)</p>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                disabled={isSubmitting}
              />
              <Button variant="outline" asChild disabled={isSubmitting}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading {selectedFile?.name}...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Selected File */}
            {selectedFile && !isUploading && (
              <div className="space-y-2">
                <Label>Selected File</Label>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {React.createElement(getFileIcon(selectedFile), { className: "w-5 h-5 text-slate-500" })}
                    <div>
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(selectedFile.size)}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          Ready to Upload
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting || isUploading || !selectedFile || formData.departments.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              onClick={() => handleSubmit("submit")}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting || isUploading || !selectedFile || formData.departments.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit to {formData.departments.length} Department{formData.departments.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
