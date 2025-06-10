"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { Share, FileText, Search, Eye, Download, Calendar, User, Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

interface SharedFile {
  _id: string
  title: string
  description: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
  file: {
    name: string
    url: string
    size: number
  }
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
  sharedWith: Array<{
    user: string
    permission: string
    sharedAt: string
  }>
}

export default function SharedFilesPage() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)

  // Redirect if not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Fetch shared files
  useEffect(() => {
    const fetchSharedFiles = async () => {
      try {
        setLoading(true)

        // Get files that have been shared (have sharedWith data)
        const response = await api.getFiles({}, authContext)

        if (response.success && response.data) {
          // Filter files that have been shared
          const filesWithShares = response.data.files.filter(
            (file: SharedFile) => file.sharedWith && file.sharedWith.length > 0,
          )
          setSharedFiles(filesWithShares)
        }
      } catch (error) {
        console.error("Error fetching shared files:", error)
        toast({
          title: "Error",
          description: "Failed to load shared files",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSharedFiles()
  }, [authContext, toast])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "sent_back":
        return "bg-red-100 text-red-800"
      case "rejected":
        return "bg-gray-100 text-gray-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const filteredFiles = sharedFiles.filter((file) => {
    const matchesSearch =
      file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || file.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusCounts = () => {
    return {
      all: sharedFiles.length,
      pending: sharedFiles.filter((f) => f.status.toLowerCase() === "pending").length,
      approved: sharedFiles.filter((f) => f.status.toLowerCase() === "approved").length,
      sent_back: sharedFiles.filter((f) => f.status.toLowerCase() === "sent_back").length,
      rejected: sharedFiles.filter((f) => f.status.toLowerCase() === "rejected").length,
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading shared files...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Shared Files</h1>
          <p className="text-slate-600 mt-1">Track files you've shared with other departments</p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          {sharedFiles.length} Total Shared
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search shared files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Files by Status */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
          <TabsTrigger value="sent_back">Sent Back ({statusCounts.sent_back})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="space-y-4">
          {filteredFiles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Share className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">No shared files found</h3>
                <p className="text-slate-600">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "You haven't shared any files yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <Card key={file._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 rounded-full bg-blue-100">
                          <Share className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-800">{file.title}</h3>
                          <p className="text-slate-600 mt-1">{file.description}</p>

                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>Created: {new Date(file.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <User className="w-4 h-4" />
                              <span>
                                By: {file.createdBy.firstName} {file.createdBy.lastName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 mt-3">
                            <Badge variant="outline">{file.category}</Badge>
                            <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm font-medium text-slate-600 mb-1">
                              Shared with {file.sharedWith.length} recipient(s)
                            </p>
                            <p className="text-xs text-slate-500">
                              Last shared:{" "}
                              {new Date(file.sharedWith[0]?.sharedAt || file.updatedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm font-medium text-slate-600 mb-2">Attachment:</p>
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <FileText className="w-4 h-4" />
                              <span>{file.file.name}</span>
                              <span className="text-slate-400">({formatFileSize(file.file.size)})</span>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={file.file.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
