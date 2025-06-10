"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Upload, X } from "lucide-react"
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
}

export default function EditRequestPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [request, setRequest] = useState<RequestItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetDepartment: "",
    assignedDirector: "",
    priority: "",
    category: "",
  })
  const [attachments, setAttachments] = useState<any[]>([])

  const departments = ["Finance", "HR", "IT", "Operations", "Marketing", "Sales", "Legal", "Procurement"]

  const directors = {
    Finance: ["Sarah Johnson", "Michael Chen"],
    HR: ["Emily Davis", "Robert Wilson"],
    IT: ["David Kim", "Lisa Anderson"],
    Operations: ["James Brown", "Maria Garcia"],
    Marketing: ["Jennifer Lee", "Thomas Miller"],
    Sales: ["Christopher Taylor", "Amanda White"],
    Legal: ["Daniel Martinez", "Rachel Thompson"],
    Procurement: ["Kevin Johnson", "Nicole Davis"],
  }

  const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ]

  const categories = [
    { value: "approval", label: "Approval" },
    { value: "budget", label: "Budget" },
    { value: "support", label: "Support" },
    { value: "policy", label: "Policy" },
    { value: "procurement", label: "Procurement" },
    { value: "other", label: "Other" },
  ]

  useEffect(() => {
    const requestId = params.id
    if (requestId) {
      loadRequestData(requestId as string)
    }
  }, [params.id])

  const loadRequestData = (requestId: string) => {
    // Load from localStorage
    const savedRequests = JSON.parse(localStorage.getItem("requests") || "[]")
    const receivedRequests = JSON.parse(localStorage.getItem("receivedRequests") || "[]")

    // Mock requests for demonstration
    const mockRequests = [
      {
        id: 1,
        title: "Budget Approval for Q2 Marketing Campaign",
        description:
          "Requesting approval for Q2 marketing budget allocation of $50,000 for digital advertising campaigns across social media platforms and Google Ads.",
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
      },
      {
        id: 2,
        title: "IT Equipment Request",
        description:
          "Need new laptops for development team to improve productivity and support new software requirements.",
        targetDepartment: "IT",
        priority: "medium",
        category: "support",
        status: "Pending",
        createdAt: "2024-01-18",
        createdBy: "Alice Smith",
        attachments: [],
      },
    ]

    const allRequests = [...savedRequests, ...receivedRequests, ...mockRequests]
    const foundRequest = allRequests.find((r) => r.id.toString() === requestId.toString())

    if (foundRequest) {
      setRequest(foundRequest)
      setFormData({
        title: foundRequest.title,
        description: foundRequest.description,
        targetDepartment: foundRequest.targetDepartment,
        assignedDirector: foundRequest.assignedDirector || "",
        priority: foundRequest.priority,
        category: foundRequest.category,
      })
      setAttachments(foundRequest.attachments || [])
    }

    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newAttachments = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        file: file,
      }))
      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSave = async () => {
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

    if (!formData.priority) {
      toast({
        title: "Priority required",
        description: "Please select a priority level",
        variant: "destructive",
      })
      return
    }

    if (!formData.category) {
      toast({
        title: "Category required",
        description: "Please select a category",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (request) {
      const updatedRequest = {
        ...request,
        ...formData,
        attachments: attachments,
        updatedAt: new Date().toISOString(),
      }

      // Update in localStorage
      const savedRequests = JSON.parse(localStorage.getItem("requests") || "[]")
      const updatedRequests = savedRequests.map((r: any) => (r.id === request.id ? updatedRequest : r))
      localStorage.setItem("requests", JSON.stringify(updatedRequests))

      // Also update in receivedRequests if it exists there
      const receivedRequests = JSON.parse(localStorage.getItem("receivedRequests") || "[]")
      const updatedReceivedRequests = receivedRequests.map((r: any) => (r.id === request.id ? updatedRequest : r))
      localStorage.setItem("receivedRequests", JSON.stringify(updatedReceivedRequests))

      toast({
        title: "Request updated",
        description: "Your request has been successfully updated",
      })

      router.push(`/dashboard/requests/view/${request.id}`)
    }

    setIsSaving(false)
  }

  const canEdit = () => {
    return request?.status === "Pending" || request?.status === "Sent Back"
  }

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

  if (!canEdit()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">Cannot edit request</h2>
        <p className="text-slate-600 mt-2">This request cannot be edited in its current status: {request.status}</p>
        <Link href={`/dashboard/requests/view/${request.id}`}>
          <Button className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Request
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/requests/view/${request.id}`}
            className="inline-flex items-center text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Request</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">Edit Request</h1>
          <p className="text-slate-600 mt-1">Update your request information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
          <CardDescription>Update the details of your request</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                placeholder="Enter request title"
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
                      {category.label}
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
              placeholder="Describe your request in detail"
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
                onValueChange={(value) => {
                  handleInputChange("targetDepartment", value)
                  handleInputChange("assignedDirector", "") // Reset director when department changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
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
                disabled={!formData.targetDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select director" />
                </SelectTrigger>
                <SelectContent>
                  {formData.targetDepartment &&
                    directors[formData.targetDepartment as keyof typeof directors]?.map((director) => (
                      <SelectItem key={director} value={director}>
                        {director}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Attachments */}
          <div className="space-y-4">
            <Label>Attachments</Label>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 mb-2">Drag and drop files here, or click to browse</p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                Choose Files
              </Button>
              <p className="text-sm text-slate-500 mt-2">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 10MB each)
              </p>
            </div>

            {/* Attached Files */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Files ({attachments.length})</Label>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800">{attachment.name}</p>
                          <p className="text-sm text-slate-600">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link href={`/dashboard/requests/view/${request.id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
