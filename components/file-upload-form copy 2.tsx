"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { Upload, FileText, Loader2, Building2, Folder, X, Plus, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadFormProps {
  onClose: () => void
  onSuccess: () => void
  authContext: any
  themeColors: any
  currentFolder?: any
}

export default function FileUploadForm({
  onClose,
  onSuccess,
  authContext,
  themeColors,
  currentFolder,
}: FileUploadFormProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "document",
    priority: "medium",
    folderId: currentFolder?._id || "",
    departments: [] as string[],
  })

  // // Check if current folder allows file uploads
  // const canUploadToCurrentFolder = () => {
  //   if (!currentFolder) return false

  //   const userDeptId = authContext.user?.department?._id || authContext.user?.department

  //   // Can upload to:
  //   // 1. Private folders they created
  //   // 2. Department folders of their department
  //   // 3. Public folders within their department
  //   if (currentFolder.accessLevel === "private" && currentFolder.createdBy?._id === authContext.user?._id) {
  //     return true
  //   }

  //   if (
  //     currentFolder.accessLevel === "department" &&
  //     currentFolder.departments.some((dept: any) => dept._id === userDeptId)
  //   ) {
  //     return true
  //   }

  //   if (
  //     currentFolder.accessLevel === "public" &&
  //     currentFolder.departments.some((dept: any) => dept._id === userDeptId)
  //   ) {
  //     return true
  //   }

  //   return false
  // }

  // Check if department sharing should be shown
  const shouldShowDepartmentSharing = () => {
    if (!formData.folderId) return false

    const selectedFolder = folders.find((f) => f._id === formData.folderId)
    if (!selectedFolder) return false

    // Show department sharing for private and department folders (not public)
    return selectedFolder.accessLevel === "private" || selectedFolder.accessLevel === "department"
  }

  // Fetch folders and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foldersResponse, deptResponse] = await Promise.all([
          api.getFolders({ includeAll: true }, authContext),
          api.getDepartments({ includeInactive: false }, authContext),
        ])

        if (foldersResponse.success && foldersResponse.data) {
          const allFolders = Array.isArray(foldersResponse.data)
            ? foldersResponse.data
            : foldersResponse.data.folders || []

          // Filter folders where user can upload
          const uploadableFolders = allFolders.filter((folder: any) => {
            const userDeptId = authContext.user?.department?._id || authContext.user?.department

            // Can upload to private folders they created
            if (folder.accessLevel === "private" && folder.createdBy?._id === authContext.user?._id) {
              return true
            }

            // Can upload to department folders of their department
            if (
              folder.accessLevel === "department" &&
              folder.departments.some((dept: any) => dept._id === userDeptId)
            ) {
              return true
            }

            // Can upload to public folders within their department
            if (folder.accessLevel === "public" && folder.departments.some((dept: any) => dept._id === userDeptId)) {
              return true
            }

            return false
          })

          setFolders(uploadableFolders)
        }

        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data.departments || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [authContext])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
      // Set name from first file if no name is set
      if (!formData.name && files[0]) {
        setFormData((prev) => ({ ...prev, name: files[0].name }))
      }
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file to upload",
        variant: "destructive",
      })
      return
    }

    if (!formData.folderId) {
      toast({
        title: "Error",
        description: "Please select a destination folder",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      // Upload files one by one or in batch
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        uploadFormData.append("name", selectedFiles.length === 1 ? formData.name : file.name)
        uploadFormData.append("description", formData.description)
        uploadFormData.append("category", formData.category)
        uploadFormData.append("priority", formData.priority)

        // Add folder ID if selected
        if (formData.folderId) {
          uploadFormData.append("folderId", formData.folderId)
        }

        // Add departments only if sharing is enabled for this folder type
        if (shouldShowDepartmentSharing()) {
          formData.departments.forEach((deptId) => {
            uploadFormData.append("departments[]", deptId)
          })
        }

        return api.createFile(uploadFormData, authContext)
      })

      const results = await Promise.all(uploadPromises)
      const successCount = results.filter((result) => result.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${successCount} file(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
        })
        onSuccess()
      } else {
        throw new Error("All uploads failed")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warning for current folder if can't upload */}
      {currentFolder  && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            You cannot upload files to "{currentFolder.name}". Please select a different destination folder below.
          </AlertDescription>
        </Alert>
      )}

      {/* File Selection */}
      <div className="space-y-4">
        <Label htmlFor="file-upload">Select Files</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">Click to upload files</p>
              <p className="text-sm text-gray-500">PDF, DOC, XLS, images, or other files up to 15MB each</p>
              <p className="text-xs text-gray-400 mt-2">You can select multiple files at once</p>
            </div>
          </label>
        </div>

        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Files ({selectedFiles.length})</Label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* File Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="file-name">
            {selectedFiles.length === 1 ? "File Name" : "Base Name (for multiple files)"}
          </Label>
          <Input
            id="file-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={selectedFiles.length === 1 ? "Enter file name" : "Base name for files"}
            required={selectedFiles.length === 1}
          />
          {selectedFiles.length > 1 && (
            <p className="text-xs text-gray-500 mt-1">Individual file names will be used for multiple files</p>
          )}
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="report">Report</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="policy">Policy</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter description for the file(s)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
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
        <div>
          <Label htmlFor="folder">Destination Folder *</Label>
          <pre>{JSON.stringify(currentFolder, null, 2)}</pre>
          <Select
            value={formData.folderId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, folderId: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination folder" />
            </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder._id} value={folder._id}>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      <span>{folder.name}</span>
                      <div className="flex gap-1">
                        {folder.isDefault && <span className="text-xs text-gray-500">(Default)</span>}
                        {folder.accessLevel === "private" && <span className="text-xs text-red-600">(Private)</span>}
                        {folder.accessLevel === "department" && (
                          <span className="text-xs text-orange-600">(Department)</span>
                        )}
                        {folder.accessLevel === "public" && <span className="text-xs text-green-600">(Public)</span>}
                        {currentFolder && folder._id === currentFolder._id && (
                          <span className="text-xs text-blue-600">(Current)</span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            {currentFolder && currentFolder.accessLevel === "department" && (
              <SelectItem key={currentFolder._id} value={currentFolder._id}>
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>{currentFolder.name}</span>
                  <div className="flex gap-1">
                    <span className="text-xs text-blue-600">(Current)</span>
                  </div>
                </div>
              </SelectItem>
            )}
          </Select>
          {folders.length === 0 && (
            <p className="text-xs text-red-500 mt-1">
              No folders available for upload. You can only upload to folders within your department.
            </p>
          )}
        </div>
      </div>

      {/* Department Selection - Only show for private/department folders */}
      {shouldShowDepartmentSharing() && (
        <div>
          <Label className="text-sm font-medium">Share with Additional Departments (Optional)</Label>
          <p className="text-xs text-gray-500 mb-2">
            Select departments to share this file with beyond the folder's default access
          </p>
          <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
            {departments.map((dept) => (
              <div key={dept._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                <Checkbox
                  checked={formData.departments.includes(dept._id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        departments: [...prev.departments, dept._id],
                      }))
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        departments: prev.departments.filter((id) => id !== dept._id),
                      }))
                    }
                  }}
                />
                <Label className="text-sm cursor-pointer flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {dept.name} ({dept.code})
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUploading || selectedFiles.length === 0 || !formData.folderId}
          className={`flex-1 ${themeColors.primary} hover:${themeColors.primaryHover} text-white`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading {selectedFiles.length} file(s)...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Upload {selectedFiles.length} File(s)
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
