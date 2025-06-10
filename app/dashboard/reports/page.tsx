"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import {
  FileText,
  Download,
  CalendarIcon,
  Filter,
  BarChart3,
  PieChartIcon,
  TrendingUp,
  Users,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import { redirect } from "next/navigation"

const COLORS = ["#f97316", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"]

export default function ReportsPage() {
  const { toast } = useToast()
  const authContext = useAuth()

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date(),
  })

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(["all"])
  const [reportType, setReportType] = useState("overview")
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [reportData, setReportData] = useState<any>({
    overview: {
      totalFiles: 0,
      totalRequests: 0,
      pendingApprovals: 0,
      completedThisMonth: 0,
      departmentStats: [],
      monthlyTrend: [],
      statusDistribution: [],
    },
  })

  // Redirect if not authenticated or not admin/director
  if (!authContext.isAuthenticated) {
    redirect("/login")
  }

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
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
      }
    }

    fetchDepartments()
  }, [authContext, toast])

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      if (!dateRange.from || !dateRange.to) return

      try {
        setLoading(true)

        const params = {
          type: reportType,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          departments: selectedDepartments.includes("all") ? [] : selectedDepartments,
        }

        const response = await api.getReportData(params, authContext)

        if (response.success && response.data) {
          // Transform API data to match our component's expected format
          const transformedData = transformReportData(response.data, reportType)
          setReportData({
            ...reportData,
            [reportType]: transformedData,
          })
        } else {
          throw new Error(response.error || "Failed to fetch report data")
        }
      } catch (error: any) {
        console.error("Error fetching report data:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load report data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [reportType, dateRange, selectedDepartments, authContext, toast])

  // Transform API data to match our component's expected format
  const transformReportData = (apiData: any, type: string) => {
    if (type === "overview") {
      return {
        totalFiles: apiData.totals?.files || 0,
        totalRequests: apiData.totals?.requests || 0,
        pendingApprovals: apiData.fileStatus?.find((s: any) => s._id === "Pending")?.count || 0,
        completedThisMonth: apiData.fileStatus?.find((s: any) => s._id === "Approved")?.count || 0,
        departmentStats: apiData.departmentStats || [],
        monthlyTrend: apiData.monthlyTrend || [],
        statusDistribution: [
          {
            name: "Approved",
            value: apiData.fileStatus?.find((s: any) => s._id === "Approved")?.count || 0,
            color: "#22c55e",
          },
          {
            name: "Pending",
            value: apiData.fileStatus?.find((s: any) => s._id === "Pending")?.count || 0,
            color: "#f97316",
          },
          {
            name: "Draft",
            value: apiData.fileStatus?.find((s: any) => s._id === "Draft")?.count || 0,
            color: "#3b82f6",
          },
          {
            name: "Rejected",
            value: apiData.fileStatus?.find((s: any) => s._id === "Rejected")?.count || 0,
            color: "#ef4444",
          },
          {
            name: "In Review",
            value: apiData.fileStatus?.find((s: any) => s._id === "In Review")?.count || 0,
            color: "#8b5cf6",
          },
        ],
      }
    }

    return apiData
  }

  const handleDepartmentChange = (department: string, checked: boolean) => {
    if (department === "all") {
      setSelectedDepartments(checked ? ["all"] : [])
    } else {
      setSelectedDepartments((prev) => {
        const filtered = prev.filter((d) => d !== "all")
        if (checked) {
          return [...filtered, department]
        } else {
          return filtered.filter((d) => d !== department)
        }
      })
    }
  }

  const generateReport = async (format: "pdf" | "excel") => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Date range required",
        description: "Please select a valid date range",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const reportParams = {
        type: reportType,
        format,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        departments: selectedDepartments.includes("all") ? [] : selectedDepartments,
      }

      const response = await api.generateReport(reportParams, authContext)

      if (response.success && response.data) {
        // Handle file download from response
        const blob = new Blob([response.data], {
          type:
            format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-${reportType}-${format === "pdf" ? "pdf" : "xlsx"}`
        a.click()
        URL.revokeObjectURL(url)

        toast({
          title: "Report generated",
          description: `Your ${reportType} report has been generated successfully`,
        })
      } else {
        throw new Error(response.error || "Failed to generate report")
      }
    } catch (error: any) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-slate-600 mt-1">Generate comprehensive reports and analyze system data</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => generateReport("pdf")} disabled={isGenerating} className="bg-red-500 hover:bg-red-600">
            <FileText className="w-4 h-4 mr-2" />
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Export PDF"
            )}
          </Button>
          <Button
            onClick={() => generateReport("excel")}
            disabled={isGenerating}
            className="bg-green-500 hover:bg-green-600"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Export Excel"
            )}
          </Button>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-orange-500" />
            Report Configuration
          </CardTitle>
          <CardDescription>Configure your report parameters and filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Report Type */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">System Overview</SelectItem>
                  <SelectItem value="files">Files Report</SelectItem>
                  <SelectItem value="requests">Requests Report</SelectItem>
                  <SelectItem value="departments">Department Analysis</SelectItem>
                  <SelectItem value="users">User Activity</SelectItem>
                  <SelectItem value="performance">Performance Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Quick Date Filters */}
            <div className="space-y-2">
              <Label>Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDateRange({
                      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                      to: new Date(),
                    })
                  }
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDateRange({
                      from: new Date(new Date().getFullYear(), 0, 1),
                      to: new Date(),
                    })
                  }
                >
                  This Year
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDateRange({
                      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      to: new Date(),
                    })
                  }
                >
                  Last 7 Days
                </Button>
              </div>
            </div>
          </div>

          {/* Department Selection */}
          <div className="space-y-3">
            <Label>Departments</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-departments"
                  checked={selectedDepartments.includes("all")}
                  onCheckedChange={(checked) => handleDepartmentChange("all", checked as boolean)}
                />
                <Label htmlFor="all-departments" className="font-medium">
                  All Departments
                </Label>
              </div>
              {departments.map((dept) => (
                <div key={dept._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={dept._id}
                    checked={selectedDepartments.includes(dept._id)}
                    onCheckedChange={(checked) => handleDepartmentChange(dept._id, checked as boolean)}
                    disabled={selectedDepartments.includes("all")}
                  />
                  <Label htmlFor={dept._id}>{dept.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="ml-2 text-lg">Loading report data...</span>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="tables">Data Tables</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Files</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {reportData.overview.totalFiles.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+12.5%</span>
                    <span className="text-slate-500 ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Requests</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {reportData.overview.totalRequests.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-100">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+8.2%</span>
                    <span className="text-slate-500 ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
                      <p className="text-3xl font-bold text-slate-800">{reportData.overview.pendingApprovals}</p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100">
                      <Clock className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-600">Requires attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Completed This Month</p>
                      <p className="text-3xl font-bold text-slate-800">{reportData.overview.completedThisMonth}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+15.3%</span>
                    <span className="text-slate-500 ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance Summary</CardTitle>
                <CardDescription>Overview of activity across all departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.overview.departmentStats.map((dept: any, index: number) => (
                    <div
                      key={dept.name || dept._id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-white">
                          <Building2 className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{dept.name}</h4>
                          <p className="text-sm text-slate-600">
                            {dept.files || dept.fileCount} files • {dept.requests || dept.requestCount} requests
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">
                            {dept.completed || dept.completedCount || 0} completed
                          </p>
                          <p className="text-xs text-slate-500">{dept.pending || dept.pendingCount || 0} pending</p>
                        </div>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{
                              width: `${
                                (
                                  (dept.completed || dept.completedCount || 0) /
                                    ((dept.files || dept.fileCount || 0) + (dept.requests || dept.requestCount || 0))
                                ) * 100 || 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
                    Department Activity
                  </CardTitle>
                  <CardDescription>Files and requests by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.overview.departmentStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="files" fill="#f97316" name="Files" />
                      <Bar dataKey="requests" fill="#ef4444" name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="w-5 h-5 mr-2 text-blue-500" />
                    Status Distribution
                  </CardTitle>
                  <CardDescription>Current status of all items</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.overview.statusDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {reportData.overview.statusDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Files and requests activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={reportData.overview.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="files"
                      stackId="1"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Department Statistics</CardTitle>
                <CardDescription>Comprehensive data breakdown by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Department</th>
                        <th className="text-right p-3 font-medium">Total Files</th>
                        <th className="text-right p-3 font-medium">Total Requests</th>
                        <th className="text-right p-3 font-medium">Pending</th>
                        <th className="text-right p-3 font-medium">Completed</th>
                        <th className="text-right p-3 font-medium">Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.overview.departmentStats.map((dept: any, index: number) => (
                        <tr key={dept.name || dept._id} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-medium">{dept.name}</td>
                          <td className="p-3 text-right">{dept.files || dept.fileCount}</td>
                          <td className="p-3 text-right">{dept.requests || dept.requestCount}</td>
                          <td className="p-3 text-right">
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              {dept.pending || dept.pendingCount || 0}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              {dept.completed || dept.completedCount || 0}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-medium">
                              {(
                                ((dept.completed || dept.completedCount || 0) /
                                  ((dept.files || dept.fileCount || 0) + (dept.requests || dept.requestCount || 0))) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
