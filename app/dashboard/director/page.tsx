"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileText, Users, Building2, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { ApiClient, DirectorDashboardResponse } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

const COLORS = ["#f97316", "#ef4444", "#22c55e", "#3b82f6"]

export default function DirectorDashboard() {
  const authContext = useAuth()
  const { user, isAuthenticated, loading: authLoading } = authContext
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
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

    const fetchDirectorDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await ApiClient.getInstance().get<DirectorDashboardResponse>("/dashboard/director", undefined, authContext)
        if (!response?.success || !response?.data) {
          throw new Error("Failed to fetch director dashboard stats")
        }
        const data = response.data

        // Set stats
        setStats([
          { title: "Pending Approvals", value: data.stats.pendingRequests.length, icon: Clock, color: "bg-red-500" },
          { title: "Department Users", value: data.stats.totalUsers, icon: Users, color: "bg-blue-500" },
          { title: "Department Files", value: data.stats.totalFiles, icon: FileText, color: "bg-green-500" },
          { title: "Recent Activities", value: data.stats.recentActivities.length, icon: CheckCircle, color: "bg-purple-500" },
        ])

        // Prepare chart data for file status distribution
        const fileStatusData = data.stats.fileStatusCounts.map((status: any) => ({
          name: status._id,
          value: status.count
        }))
        setChartData(fileStatusData)

        // Set pending requests
        setPendingRequests(data.stats.pendingRequests)

        // Set recent activities
        setRecentActivities(data.stats.recentActivities)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDirectorDashboardData()
  }, [user?.role, isAuthenticated])

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
            Director Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening in your department today.</p>
        </div>
        <Badge variant="outline" className="text-red-600 border-red-200">
          DIRECTOR
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>File Status Distribution</CardTitle>
            <CardDescription>Current status of department files</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Requests awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div>
                      <p className="font-medium text-slate-800">{request.title}</p>
                      <p className="text-sm text-slate-600">Created by {request.createdBy.fullName}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">{new Date(request.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Department Activity</CardTitle>
          <CardDescription>Latest updates and actions in your department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-slate-800">{activity.action}</p>
                    <p className="text-sm text-slate-600">by {activity.user.fullName}</p>
                  </div>
                </div>
                <span className="text-sm text-slate-500">{new Date(activity.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}