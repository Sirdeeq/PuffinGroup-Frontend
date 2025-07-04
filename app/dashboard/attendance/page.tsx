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
  Clock,
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
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Checked In
          </Badge>
        )
      case "checked-out":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <XCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  const getLocationBadge = (location: string) => {
    const locationColors = {
      office: "bg-purple-100 text-purple-800",
      remote: "bg-orange-100 text-orange-800",
      field: "bg-teal-100 text-teal-800",
      client: "bg-indigo-100 text-indigo-800",
    }

    return (
      <Badge
        className={`${locationColors[location as keyof typeof locationColors] || "bg-gray-100 text-gray-800"} hover:bg-current`}
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage employee attendance records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchAttendance} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error loading attendance data:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* {process.env.NODE_ENV === "development" && (
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Debug Info:</strong>
              <br />
              attendanceData: type={typeof attendanceData}, isArray={Array.isArray(attendanceData).toString()}, length=
              {Array.isArray(attendanceData) ? attendanceData.length : "N/A"}
              <br />
              filteredData: type={typeof filteredData}, isArray={Array.isArray(filteredData).toString()}, length=
              {Array.isArray(filteredData) ? filteredData.length : "N/A"}
              <br />
              loading: {loading.toString()}, error: {error || "none"}
            </div>
          )} */}

          {/* Quick Date Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(0)} className="text-xs">
              <CalendarLucide className="w-3 h-3 mr-1" />
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(7)} className="text-xs">
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(30)} className="text-xs">
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={handleThisMonth} className="text-xs bg-transparent">
              This Month
            </Button>
          </div>

          {/* Date Range Picker and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Range Picker */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  {/* <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="field">Field</SelectItem>
                  <SelectItem value="client">Client Site</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Currently Checked In</p>
                <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <XCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-purple-600">{formatAvgDuration(stats.avgDuration)}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Attendance Records
              <Badge variant="secondary">{safeFilteredData.length} records</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading attendance records...</p>
              </div>
            </div>
          ) : safeFilteredData.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <CalendarLucide className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                <p className="text-gray-600 mb-4">
                  {attendanceData.length === 0
                    ? "No attendance records exist for the selected date range."
                    : "No records match your current filters."}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setLocationFilter("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button onClick={() => handleQuickDateSelect(0)}>View Today's Records</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {safeFilteredData.map((record) => (
                <div
                  key={record._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {record.user.firstName} {record.user.lastName}
                          </p>
                          {getStatusBadge(record.status)}
                          {getLocationBadge(record.location)}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{record.user.email}</p>
                        <p className="text-xs text-gray-500">{formatDepartment(record.user.department)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600 font-medium">Check In</p>
                        <p className="text-gray-900">
                          {record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.checkIn ? format(new Date(record.checkIn), "MMM dd") : ""}
                        </p>
                      </div>

                      {record.checkOut && (
                        <div className="text-center">
                          <p className="text-gray-600 font-medium">Check Out</p>
                          <p className="text-gray-900">{format(new Date(record.checkOut), "HH:mm")}</p>
                          <p className="text-xs text-gray-500">{format(new Date(record.checkOut), "MMM dd")}</p>
                        </div>
                      )}

                      <div className="text-center">
                        <p className="text-gray-600 font-medium">Duration</p>
                        <p className="text-gray-900 font-semibold">{formatDuration(record)}</p>
                      </div>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {record.notes}
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
