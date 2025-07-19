"use client"
import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { Upload, FileText, Loader2, Building2, Folder, X, Plus } from "lucide-react"

interface FileUploadFormProps {
  onClose: () => void
  onSuccess: () => void
  authContext: any
  themeColors: any
  currentFolder?: any
  breadcrumb?: Array<{ id: string; name: string }>
}

export default function FileUploadForm({
  onClose,
  onSuccess,
  authContext,
  themeColors,
  currentFolder,
  breadcrumb = [],
}: FileUploadFormProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  const defaultFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : currentFolder?._id || ""

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "document",
    priority: "medium",
    folderId: defaultFolderId,
    departments: [] as string[],
  })

  const lastBreadcrumbFolder = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null

  // Check if department sharing should be shown
  const shouldShowDepartmentSharing = () => {
    if (!formData.folderId) return false
    const selectedFolder = folders.find((f) => f._id === formData.folderId)
    if (!selectedFolder) return false
    // Show department sharing for private and department folders (not public)
    return selectedFolder.accessLevel === "private" || selectedFolder.accessLevel === "department"
  }

  // Helper function to determine if a user can upload to a folder
  const canUploadToFolder = (folder: any) => {
    const userDeptId = authContext.user?.department?._id || authContext.user?.department

    // Can upload to private folders they created
    if (folder.accessLevel === "private" && folder.createdBy?._id === authContext.user?._id) {
      return true
    }

    // Can upload to department folders of their department
    if (folder.accessLevel === "department" && folder.departments.some((dept: any) => dept._id === userDeptId)) {
      return true
    }

    // Can upload to public folders within their department
    if (folder.accessLevel === "public" && folder.departments.some((dept: any) => dept._id === userDeptId)) {
      return true
    }

    return false
  }

  // Build folder tree structure with proper nesting
  const buildFolderTree = (allFolders: any[]) => {
    const folderMap = new Map()
    const rootFolders: any[] = []

    // First pass: create map of all folders
    allFolders.forEach((folder) => {
      folderMap.set(folder._id, { ...folder, children: [] })
    })

    // Second pass: build hierarchy
    folderMap.forEach((folder) => {
      if (folder.parentFolder && folder.parentFolder._id) {
        const parent = folderMap.get(folder.parentFolder._id)
        if (parent) {
          parent.children.push(folder)
        } else {
          // Parent not in uploadable folders, treat as root
          rootFolders.push(folder)
        }
      } else {
        rootFolders.push(folder)
      }
    })

    // Sort folders: default first, then alphabetically
    const sortFolders = (folders: any[]) => {
      return folders
        .sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1
          if (!a.isDefault && b.isDefault) return 1
          return a.name.localeCompare(b.name)
        })
        .map((folder) => ({
          ...folder,
          children: sortFolders(folder.children),
        }))
    }

    return sortFolders(rootFolders)
  }

  // Render folder options with better hierarchy visualization
  const renderFolderOptions = (folders: any[], depth = 0) => {
    return folders.map((folder) => (
      <React.Fragment key={folder._id}>
        <SelectItem value={folder._id}>
          <div className="flex items-center gap-2">
            {/* Indentation for nested folders */}
            {depth > 0 && (
              <div className="flex items-center">
                {Array(depth)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="w-4 flex justify-center">
                      {i === depth - 1 ? (
                        <div className="w-2 h-2 border-l border-b border-gray-300 rounded-bl" />
                      ) : (
                        <div className="w-px h-4 bg-gray-300" />
                      )}
                    </div>
                  ))}
              </div>
            )}
            {/* Folder icon */}
            <Folder
              className={`w-4 h-4 ${
                folder.accessLevel === "private"
                  ? "text-red-500"
                  : folder.accessLevel === "department"
                    ? "text-orange-500"
                    : "text-green-500"
              }`}
            />
            {/* Folder name */}
            <span className="truncate">{folder.name}</span>
            {/* Status badges */}
            <div className="flex gap-1 ml-auto">
              {folder.isDefault && <span className="text-xs text-blue-600 font-medium">(Default)</span>}
              {folder.accessLevel === "private" && <span className="text-xs text-red-600">(Private)</span>}
              {folder.accessLevel === "department" && <span className="text-xs text-orange-600">(Department)</span>}
              {folder.accessLevel === "public" && <span className="text-xs text-green-600">(Public)</span>}
              {currentFolder && folder._id === currentFolder._id && (
                <span className="text-xs text-blue-600 font-medium">(Current)</span>
              )}
            </div>
          </div>
        </SelectItem>
        {folder.children.length > 0 && renderFolderOptions(folder.children, depth + 1)}
      </React.Fragment>
    ))
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
          const uploadableFolders = allFolders.filter((folder) => canUploadToFolder(folder))

          // Build folder tree structure
          const folderTree = buildFolderTree(uploadableFolders)
          setFolders(folderTree)
        }

        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data.departments || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load folder data",
          variant: "destructive",
        })
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

      // Upload files one by one
      const uploadPromises = selectedFiles.map(async (file) => {
        const uploadFormData = new FormData()

        // Append the file
        uploadFormData.append("file", file)

        // Append all other form data
        uploadFormData.append("name", selectedFiles.length === 1 ? formData.name : file.name)
        uploadFormData.append("description", formData.description)
        uploadFormData.append("category", formData.category)
        uploadFormData.append("priority", formData.priority)
        uploadFormData.append("folderId", formData.folderId)

        // Add departments if needed
        if (shouldShowDepartmentSharing() && formData.departments) {
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
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* File Selection */}
        <div className="space-y-3 sm:space-y-4">
          <Label htmlFor="file-upload" className="text-sm sm:text-base font-medium">
            Select Files
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
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
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg font-medium text-gray-700">Click to upload files</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  PDF, DOC, XLS, images, or other files up to 15MB each
                </p>
                <p className="text-xs text-gray-400 mt-1 sm:mt-2">You can select multiple files at once</p>
              </div>
            </label>
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Files ({selectedFiles.length})</Label>
              <div className="max-h-32 sm:max-h-48 overflow-y-auto border rounded-lg p-2 sm:p-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* File Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="file-name" className="text-sm font-medium">
              {selectedFiles.length === 1 ? "File Name" : "Base Name (for multiple files)"}
            </Label>
            <Input
              id="file-name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={selectedFiles.length === 1 ? "Enter file name" : "Base name for files"}
              required={selectedFiles.length === 1}
              className="mt-1 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
            />
            {selectedFiles.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">Individual file names will be used for multiple files</p>
            )}
          </div>
          <div>
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1 h-10 sm:h-12 rounded-lg sm:rounded-xl">
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
          <Label htmlFor="description" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Enter description for the file(s)"
            rows={3}
            className="mt-1 rounded-lg sm:rounded-xl text-sm sm:text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
            >
              <SelectTrigger className="mt-1 h-10 sm:h-12 rounded-lg sm:rounded-xl">
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
            <Label htmlFor="destination-folder" className="text-sm font-medium">
              Destination Folder
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="destination-folder"
                value={lastBreadcrumbFolder ? breadcrumb.map((f) => f.name).join(" > ") : "No folder selected"}
                disabled
                className="bg-gray-100 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
              />
              {/* Hidden input to store the actual folder ID */}
              <input type="hidden" name="folderId" value={formData.folderId} />
            </div>
            {lastBreadcrumbFolder && (
              <p className="text-xs text-gray-500 mt-1">Files will be uploaded to: {lastBreadcrumbFolder.name}</p>
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
            <div className="mt-2 max-h-32 sm:max-h-48 overflow-y-auto border rounded-lg p-2 sm:p-3">
              {departments.map((dept) => (
                <div key={dept._id} className="flex items-center space-x-2 p-1 sm:p-2 hover:bg-gray-50 rounded">
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
                  <Label className="text-xs sm:text-sm cursor-pointer flex items-center gap-2">
                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    {dept.name} ({dept.code})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-transparent text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isUploading || selectedFiles.length === 0 || !formData.folderId}
            className={`flex-1 h-10 sm:h-12 rounded-lg sm:rounded-xl ${themeColors.primary} hover:${themeColors.primaryHover} text-white text-sm sm:text-base`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                Uploading {selectedFiles.length} file(s)...
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Upload {selectedFiles.length} File(s)
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
