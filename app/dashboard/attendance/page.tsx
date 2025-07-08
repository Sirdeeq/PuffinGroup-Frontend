"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"
import {
  CalendarIcon,
  CheckCircle,
  User,
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  XCircle,
  MapPin,
  AlertCircle,
  CalendarIcon as CalendarLucide,
  Activity,
  Timer,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AttendanceRecord {
  _id: string
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
    department?: string | string[]
    position?: string
  }
  checkIn: string
  checkOut?: string
  location: string
  status: "active" | "checked-out"
  duration?: number
  durationFormatted?: string | null
  notes?: string
  ipAddress: string
}

export default function AttendancePage() {
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(),
    to: new Date(),
  })
  // Initialize with empty arrays to ensure they're always arrays
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const authContext = useAuth()

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      setError(null)
      let response
      const isSameDay = format(dateRange.from, "yyyy-MM-dd") === format(dateRange.to, "yyyy-MM-dd")

      console.log("Fetching attendance for date range:", {
        from: format(dateRange.from, "yyyy-MM-dd"),
        to: format(dateRange.to, "yyyy-MM-dd"),
        isSameDay,
      })

      if (isSameDay) {
        // Use daily attendance API for single day
        response = await api.getDailyAttendance(
          {
            date: format(dateRange.from, "yyyy-MM-dd"),
          },
          authContext,
        )
      } else {
        // Use date range API for multiple days
        response = await api.getAttendanceByDateRange(
          {
            startDate: format(dateRange.from, "yyyy-MM-dd"),
            endDate: format(dateRange.to, "yyyy-MM-dd"),
          },
          authContext,
        )
      }

      console.log("Raw API Response:", response)
      // Defensive programming: ensure we always work with arrays
      let dataArray: AttendanceRecord[] = []
      if (response && response.success) {
        if (Array.isArray(response.data.data)) {
          dataArray = response.data.data
        } else if (response.data && typeof response.data.data === "object") {
          // In case the API returns an object instead of array
          console.warn("API returned object instead of array:", response.data)
          dataArray = []
        } else {
          console.warn("API returned unexpected data type:", typeof response.data, response.data)
          dataArray = []
        }
      } else {
        console.warn("API call failed or returned unsuccessful response:", response)
        dataArray = []
      }

      console.log("Processed data array:", dataArray)
      // Always set arrays, never undefined or null
      setAttendanceData(dataArray)
      setFilteredData(dataArray)
    } catch (error) {
      console.error("Failed to fetch attendance:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch attendance data")
      // Ensure we set empty arrays even on error
      setAttendanceData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [dateRange])

  useEffect(() => {
    console.log("Filtering effect triggered:", {
      attendanceDataType: typeof attendanceData,
      attendanceDataIsArray: Array.isArray(attendanceData),
      attendanceDataLength: Array.isArray(attendanceData) ? attendanceData.length : "N/A",
      searchTerm,
      statusFilter,
      locationFilter,
    })
    // Defensive programming: ensure attendanceData is always an array
    const safeAttendanceData = Array.isArray(attendanceData) ? attendanceData : []

    // Filter data based on search term, status, and location
    let filtered = [...safeAttendanceData] // Create a copy

    if (searchTerm) {
      filtered = filtered.filter((record) => {
        const firstName = record.user?.firstName?.toLowerCase() || ""
        const lastName = record.user?.lastName?.toLowerCase() || ""
        const email = record.user?.email?.toLowerCase() || ""
        const department = Array.isArray(record.user?.department)
          ? record.user.department.join(" ").toLowerCase()
          : record.user?.department?.toLowerCase() || ""
        const searchLower = searchTerm.toLowerCase()

        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          email.includes(searchLower) ||
          department.includes(searchLower)
        )
      })
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter)
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((record) => record.location === locationFilter)
    }

    console.log("Filtered result:", filtered)
    setFilteredData(filtered)
  }, [searchTerm, statusFilter, locationFilter, attendanceData])

  const handleQuickDateSelect = (days: number) => {
    const today = new Date()
    if (days === 0) {
      // Today
      setDateRange({ from: today, to: today })
    } else {
      // Last X days
      setDateRange({ from: subDays(today, days), to: today })
    }
  }

  const handleThisMonth = () => {
    const today = new Date()
    setDateRange({
      from: startOfMonth(today),
      to: endOfMonth(today),
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Checked In
          </Badge>
        )
      case "checked-out":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-sm">
            <XCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  const getLocationBadge = (location: string) => {
    const locationStyles = {
      office: "bg-gradient-to-r from-purple-500 to-violet-500 text-white",
      remote: "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
      field: "bg-gradient-to-r from-teal-500 to-cyan-500 text-white",
      client: "bg-gradient-to-r from-indigo-500 to-blue-500 text-white",
    }
    return (
      <Badge
        className={`${locationStyles[location as keyof typeof locationStyles] || "bg-gradient-to-r from-gray-400 to-gray-500 text-white"} shadow-sm`}
      >
        <MapPin className="w-3 h-3 mr-1" />
        {location.charAt(0).toUpperCase() + location.slice(1)}
      </Badge>
    )
  }

  // Safe stats calculation with defensive programming
  const safeFilteredData = Array.isArray(filteredData) ? filteredData : []
  const stats = {
    total: safeFilteredData.length,
    checkedIn: safeFilteredData.filter((record) => record.status === "active").length,
    completed: safeFilteredData.filter((record) => record.status === "checked-out").length,
    avgDuration:
      safeFilteredData.length > 0
        ? safeFilteredData
            .filter((record) => record.duration)
            .reduce((acc, record) => acc + (record.duration || 0), 0) /
          Math.max(safeFilteredData.filter((record) => record.duration).length, 1)
        : 0,
  }

  const formatAvgDuration = (ms: number) => {
    if (!ms || isNaN(ms)) return "N/A"
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const formatDuration = (record: AttendanceRecord) => {
    if (record.durationFormatted && record.durationFormatted !== null) {
      return record.durationFormatted
    }
    if (record.duration) {
      const hours = Math.floor(record.duration / (1000 * 60 * 60))
      const minutes = Math.floor((record.duration % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m`
    }
    return record.status === "active" ? "In Progress" : "N/A"
  }

  const formatDepartment = (department: string | string[] | undefined) => {
    if (Array.isArray(department)) {
      return department.length > 0 ? department.join(", ") : "No Department"
    }
    return department || "No Department"
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Attendance Management</h1>
              <p className="text-slate-300 text-lg">Monitor and manage employee attendance records</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchAttendance}
                disabled={loading}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold">Error loading attendance data:</span>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
              <Filter className="w-6 h-6" />
            </div>
            Filters & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Date Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateSelect(0)}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100"
            >
              <CalendarLucide className="w-3 h-3 mr-2" />
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateSelect(7)}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100"
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateSelect(30)}
              className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 hover:from-purple-100 hover:to-violet-100"
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleThisMonth}
              className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:from-orange-100 hover:to-amber-100"
            >
              This Month
            </Button>
          </div>

          {/* Enhanced Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Date Range Picker */}
            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-slate-700 mb-3 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 bg-white border-slate-200 hover:bg-slate-50",
                      !dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-slate-500" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from) {
                        setDateRange({
                          from: range.from,
                          to: range.to || range.from,
                        })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 bg-white border-slate-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Checked In</SelectItem>
                  <SelectItem value="checked-out">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 block">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-12 bg-white border-slate-200">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 font-medium">Total Records</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 font-medium">Currently Checked In</p>
                <p className="text-3xl font-bold mt-1">{stats.checkedIn}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-violet-500 text-white overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 font-medium">Completed Sessions</p>
                <p className="text-3xl font-bold mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Activity className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 font-medium">Avg Duration</p>
                <p className="text-3xl font-bold mt-1">{formatAvgDuration(stats.avgDuration)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Timer className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Attendance Records */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Attendance Records</h3>
                <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-700">
                  {safeFilteredData.length} records
                </Badge>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="relative">
                  <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <div className="absolute inset-0 w-12 h-12 border-4 border-blue-200 rounded-full mx-auto"></div>
                </div>
                <p className="text-slate-600 text-lg">Loading attendance records...</p>
              </div>
            </div>
          ) : safeFilteredData.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CalendarLucide className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No attendance records found</h3>
                <p className="text-slate-600 mb-6">
                  {attendanceData.length === 0
                    ? "No attendance records exist for the selected date range."
                    : "No records match your current filters."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setLocationFilter("all")
                    }}
                    className="bg-white"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => handleQuickDateSelect(0)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                  >
                    View Today's Records
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {safeFilteredData.map((record) => (
                <div
                  key={record._id}
                  className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-lg font-semibold text-slate-900">
                            {record.user.firstName} {record.user.lastName}
                          </p>
                          {getStatusBadge(record.status)}
                          {getLocationBadge(record.location)}
                        </div>
                        <p className="text-slate-600 mb-1">{record.user.email}</p>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <p className="text-sm text-slate-500">{formatDepartment(record.user.department)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className="text-slate-600 font-semibold mb-1">Check In</p>
                        <p className="text-lg font-bold text-slate-900">
                          {record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "N/A"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {record.checkIn ? format(new Date(record.checkIn), "MMM dd") : ""}
                        </p>
                      </div>
                      {record.checkOut && (
                        <div className="text-center">
                          <p className="text-slate-600 font-semibold mb-1">Check Out</p>
                          <p className="text-lg font-bold text-slate-900">
                            {format(new Date(record.checkOut), "HH:mm")}
                          </p>
                          <p className="text-xs text-slate-500">{format(new Date(record.checkOut), "MMM dd")}</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-slate-600 font-semibold mb-1">Duration</p>
                        <p className="text-lg font-bold text-blue-600">{formatDuration(record)}</p>
                      </div>
                    </div>
                  </div>
                  {record.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Notes:</span> {record.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
