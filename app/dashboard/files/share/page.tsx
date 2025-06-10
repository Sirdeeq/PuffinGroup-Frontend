"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { FileText, Send, ArrowLeft, Users, Building2, Loader2 } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

interface FileItem {
  _id: string
  title: string
  description: string
  category: string
  status: string
  createdAt: string
  requiresSignature: boolean
  file: {
    name: string
    size: number
  }
}

interface Department {
  _id: string
  name: string
  code: string
  isActive: boolean
}

export default function ShareFilesPage() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [shareMessage, setShareMessage] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Fetch draft files and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch draft files
        const filesResponse = await api.getFiles({ status: "draft" }, authContext)
        if (filesResponse.success && filesResponse.data) {
          setSelectedFiles(filesResponse.data.files || [])
        }

        // Fetch departments
        const deptResponse = await api.getDepartments({ includeInactive: false }, authContext)
        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data.departments || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authContext, toast])

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    setSelectedDepartments((prev) => (checked ? [...prev, departmentId] : prev.filter((d) => d !== departmentId)))
  }

  const handleFileToggle = (fileId: string, checked: boolean) => {
    setSelectedFiles((prev) => (checked ? prev : prev.filter((file) => file._id !== fileId)))
  }

  const handleShare = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to share",
        variant: "destructive",
      })
      return
    }

    if (selectedDepartments.length === 0) {
      toast({
        title: "No departments selected",
        description: "Please select at least one department to share with",
        variant: "destructive",
      })
      return
    }

    setIsSharing(true)

    try {
      // Share each file with selected departments
      for (const file of selectedFiles) {
        const shareData = {
          users: selectedDepartments, // In this case, we're sharing with departments
          permission: "view",
          message: shareMessage,
        }

        const response = await api.shareFile(file._id, shareData, authContext)

        if (!response.success) {
          throw new Error(`Failed to share ${file.title}`)
        }
      }

      toast({
        title: "Files shared successfully",
        description: `${selectedFiles.length} file(s) shared with ${selectedDepartments.length} department(s)`,
      })

      // Reset form
      setSelectedFiles([])
      setSelectedDepartments([])
      setShareMessage("")

      // Refresh the files list
      const filesResponse = await api.getFiles({ status: "draft" }, authContext)
      if (filesResponse.success && filesResponse.data) {
        setSelectedFiles(filesResponse.data.files || [])
      }
    } catch (error: any) {
      toast({
        title: "Sharing failed",
        description: error.message || "Failed to share files",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading files...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/files">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Share Files</h1>
          <p className="text-slate-600 mt-1">Share draft files with other departments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-500" />
              Draft Files ({selectedFiles.length})
            </CardTitle>
            <CardDescription>Files available for sharing (only Draft files can be shared)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No draft files available for sharing</p>
                <Link href="/files/create">
                  <Button variant="outline" className="mt-2">
                    Create New File
                  </Button>
                </Link>
              </div>
            ) : (
              selectedFiles.map((file) => (
                <div key={file._id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={true}
                    onCheckedChange={(checked) => handleFileToggle(file._id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{file.title}</h4>
                    <p className="text-sm text-slate-600">{file.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{file.category}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">{file.status}</Badge>
                      {file.requiresSignature && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          Signature Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {file.file.name} ({formatFileSize(file.file.size)}) • Created{" "}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Share Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-500" />
              Share Settings
            </CardTitle>
            <CardDescription>Select departments and add a message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Department Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Departments</Label>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {departments.map((department) => (
                  <div
                    key={department._id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <Checkbox
                      id={department._id}
                      checked={selectedDepartments.includes(department._id)}
                      onCheckedChange={(checked) => handleDepartmentToggle(department._id, checked as boolean)}
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <Label htmlFor={department._id} className="cursor-pointer">
                        {department.name} ({department.code})
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
              {selectedDepartments.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Files will be shared with {selectedDepartments.length} department(s)
                  </p>
                </div>
              )}
            </div>

            {/* Share Message */}
            <div className="space-y-2">
              <Label htmlFor="share-message">Message (Optional)</Label>
              <Textarea
                id="share-message"
                placeholder="Add a message for the recipients..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={4}
              />
            </div>

            {/* Share Button */}
            <Button
              onClick={handleShare}
              disabled={isSharing || selectedFiles.length === 0 || selectedDepartments.length === 0}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                `Share ${selectedFiles.length} File(s)`
              )}
            </Button>

            {/* Share Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">What happens when you share?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Files will be visible to selected departments</li>
                <li>• Recipients can view and download files</li>
                <li>• Files can be approved, rejected, or sent back</li>
                <li>• You'll receive notifications on status changes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
