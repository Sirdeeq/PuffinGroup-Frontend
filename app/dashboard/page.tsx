"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ApiResponse } from "@/utils/api"
import type { AdminDashboardResponse, DirectorDashboardResponse, DepartmentDashboardResponse } from "@/types/dashboard"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileText, Users, Building2, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

const COLORS = ["#f97316", "#ef4444", "#22c55e", "#3b82f6"]

export default function Dashboard() {
  const authContext = useAuth()
  const { user, isAuthenticated, loading: authLoading } = authContext
  const router = useRouter()
  const userRole = user?.role || ""
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [adminChartData, setAdminChartData] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!user?.role || !isAuthenticated) return

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        switch (user.role) {
          case "admin": {
            const response = (await api.getAdminDashboardStats(authContext)) as ApiResponse<AdminDashboardResponse>
            if (!response?.success || !response?.data) {
              throw new Error("Failed to fetch dashboard stats")
            }
            const data = response.data as AdminDashboardResponse
            console.log(data)
            setStats([
              { title: "Total Departments", value: data.stats.totalDepartments, icon: Building2, color: "bg-blue-500" },
              { title: "Active Users", value: data.stats.totalActiveUsers, icon: Users, color: "bg-green-500" },
              { title: "Total Files", value: data.stats.totalFiles, icon: FileText, color: "bg-orange-500" },
              {
                title: "Recent Activities",
                value: data.stats.recentActivities.length,
                icon: CheckCircle,
                color: "bg-purple-500",
              },
            ])
            setChartData([
              ...data.stats.filesByDepartment.map((dept) => ({
                name: dept.departmentName,
                files: dept.count,
                requests: 0,
              })),
              ...data.stats.requestsByDepartment.map((dept) => ({
                name: dept.departmentName,
                files: 0,
                requests: dept.count,
              })),
            ])
            setAdminChartData([
              ...data?.stats?.fileStatusCounts.map((status) => ({
                name: status._id,
                value: status.count,
              })),
              // ...data.stats.requestsByDepartment.map((dept) => ({
              //   name: dept.departmentName,
              //   files: 0,
              //   requests: dept.count,
              // })),
            ])
            // setRecentActivities(data.stats.recentActivities)
            break
          }
          case "director": {
            const response = (await api.getDirectorDashboardStats(
              authContext,
            )) as ApiResponse<DirectorDashboardResponse>
            if (!response?.success || !response?.data) {
              throw new Error("Failed to fetch director dashboard stats")
            }
            const data = response.data as DirectorDashboardResponse
            console.log(data)
            setStats([
              { title: "Pending Approvals", value: data.stats.pendingApprovals, icon: Clock, color: "bg-red-500" },
              { title: "Files Reviewed", value: data.stats.filesReviewed, icon: FileText, color: "bg-green-500" },
              {
                title: "Requests Approved",
                value: data.stats.requestsApproved,
                icon: CheckCircle,
                color: "bg-blue-500",
              },
              { title: "Urgent Items", value: data.stats.urgentItems, icon: AlertCircle, color: "bg-orange-500" },
            ])
            break
          }
          case "department": {
            const response = (await api.getDepartmentDashboardStats(
              user?.id || "",
              authContext,
            )) as ApiResponse<DepartmentDashboardResponse>
            if (!response?.success || !response?.data) {
              throw new Error("Failed to fetch department dashboard stats")
            }
            const data = response.data as DepartmentDashboardResponse
            console.log(data)
            setStats([
              { title: "My Files", value: data.stats.myFiles, icon: FileText, color: "bg-green-500" },
              { title: "Shared Files", value: data.stats.sharedFiles, icon: Users, color: "bg-blue-500" },
              { title: "Pending Requests", value: data.stats.pendingRequests, icon: Clock, color: "bg-orange-500" },
              { title: "Completed", value: data.stats.completed, icon: CheckCircle, color: "bg-purple-500" },
            ])
            break
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.role, isAuthenticated])

  const getThemeColor = () => {
    switch (user?.role) {
      case "admin":
        return "orange"
      case "director":
        return "red"
      case "department":
        return "green"
      default:
        return "blue"
    }
  }

  // Show loading while auth is loading or user is not authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
          </h1>
          <p className="text-slate-600 mt-1">{"Welcome back! Here's what's happening today."}</p>
        </div>
        <Badge variant="outline" className={`text-${getThemeColor()}-600 border-${getThemeColor()}-200`}>
          {userRole.toUpperCase()}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section - Only for Admin */}
      {user?.role === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Activity</CardTitle>
              <CardDescription>Files and requests by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="files" fill="#f97316" />
                  <Bar dataKey="requests" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Status Distribution</CardTitle>
              <CardDescription>Current status of all files</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={adminChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {adminChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === "success"
                        ? "bg-green-500"
                        : activity.type === "warning"
                          ? "bg-orange-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-slate-800">{activity.action}</p>
                    <p className="text-sm text-slate-600">by {activity.user.fullName}</p>
                  </div>
                </div>
                <span className="text-sm text-slate-500">{activity.createdAt}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
