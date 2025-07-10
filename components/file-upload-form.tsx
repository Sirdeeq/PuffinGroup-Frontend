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
import { Upload, FileText, Loader2, Building2, Folder } from "lucide-react"

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [folders, setFolders] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "document",
    priority: "medium",
    folderId: currentFolder?._id || "",
    departments: [] as string[],
    // requiresSignature: false,
  })

  // Fetch folders and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foldersResponse, deptResponse] = await Promise.all([
          api.getFolders(authContext),
          api.getDepartments({ includeInactive: false }, authContext),
        ])

        if (foldersResponse.success && foldersResponse.data) {
          setFolders(foldersResponse.data.folders || [])
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
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!formData.name) {
        setFormData((prev) => ({ ...prev, name: file.name }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)
      uploadFormData.append("name", formData.name)
      uploadFormData.append("description", formData.description)
      uploadFormData.append("category", formData.category)
      uploadFormData.append("priority", formData.priority)
      // uploadFormData.append("requiresSignature", formData.requiresSignature.toString())

      // Add folder ID if selected
      if (formData.folderId) {
        uploadFormData.append("folderId", formData.folderId)
      }

      // Add departments
      formData.departments.forEach((deptId) => {
        uploadFormData.append("departments[]", deptId)
      })

      const response = await api.uploadFile(uploadFormData, authContext)

      if (response.success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        onSuccess()
      } else {
        throw new Error(response.message || "Upload failed")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Selection */}
      <div className="space-y-2">
        <Label htmlFor="file-upload">Select File</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-2">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">Click to upload a file</p>
                <p className="text-sm text-gray-500">PDF, DOC, XLS, or image files up to 15MB</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* File Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="file-name">File Name</Label>
          <Input
            id="file-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter file name"
            required
          />
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
          placeholder="Enter file description"
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
          <Label htmlFor="folder">Folder</Label>
          <Select
            value={formData.folderId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, folderId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={currentFolder ? currentFolder.name : "Select folder"} />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder._id} value={folder._id}>
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    {folder.name}
                    {folder.isDefault && <span className="text-xs text-gray-500">(Default)</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Department Selection */}
      <div>
        <Label className="text-sm font-medium">Share with Departments</Label>
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

      {/* Signature Requirement
      <div className="flex items-center space-x-2">
        <Checkbox
          id="requires-signature"
          checked={formData.requiresSignature}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, requiresSignature: checked as boolean }))}
        />
        <Label htmlFor="requires-signature" className="text-sm">
          This file requires digital signature
        </Label>
      </div> */}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUploading}
          className={`flex-1 ${themeColors.primary} hover:${themeColors.primaryHover} text-white`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload File"
          )}
        </Button>
      </div>
    </form>
  )
}
