"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckInModal } from "./check-in-modal"
import { CheckOutModal } from "./check-out-modal"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { Clock, Calendar, CheckCircle, XCircle, MapPin, RefreshCw } from "lucide-react"

interface AttendanceWidgetProps {
  onCheckIn?: () => void
  onCheckOut?: () => void
  compact?: boolean
}

export function AttendanceWidget({ onCheckIn, onCheckOut, compact = false }: AttendanceWidgetProps) {
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showCheckOut, setShowCheckOut] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const authContext = useAuth()

  const fetchAttendanceStatus = async (showDebug = false) => {
    try {
      setIsLoading(true)

      // Try multiple approaches to get attendance data
      console.log("=== FETCHING ATTENDANCE STATUS ===")

      // Approach 1: Get all recent attendance records (no date filter)
      const allRecordsResponse = await api.getAttendanceHistory({}, authContext)
      console.log("All records response:", allRecordsResponse)

      // Approach 2: Get today's records with date filter
      const today = new Date().toISOString().split("T")[0]
      const todayRecordsResponse = await api.getAttendanceHistory({ date: today }, authContext)
      console.log("Today's records response:", todayRecordsResponse)

      let attendanceRecord = null

      // First priority: Find any active record from all records
      if (allRecordsResponse.success && allRecordsResponse.data?.length > 0) {
        const activeRecord = allRecordsResponse.data.find((record: any) => record.status === "active")
        if (activeRecord) {
          attendanceRecord = activeRecord
          console.log("✅ Found ACTIVE record:", activeRecord)
        }
      }

      // Second priority: Find today's record (active or completed)
      if (!attendanceRecord && todayRecordsResponse.success && todayRecordsResponse.data?.length > 0) {
        attendanceRecord = todayRecordsResponse.data[0] // Get the first (most recent) record
        console.log("✅ Found TODAY'S record:", attendanceRecord)
      }

      // Third priority: Find any recent record from all records
      if (!attendanceRecord && allRecordsResponse.success && allRecordsResponse.data?.length > 0) {
        // Get the most recent record
        const sortedRecords = allRecordsResponse.data.sort(
          (a: any, b: any) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime(),
        )
        attendanceRecord = sortedRecords[0]
        console.log("✅ Found RECENT record:", attendanceRecord)
      }

      setAttendanceStatus(attendanceRecord)

      // Set debug info
      setDebugInfo({
        allRecordsCount: allRecordsResponse.data?.length || 0,
        todayRecordsCount: todayRecordsResponse.data?.length || 0,
        foundRecord: !!attendanceRecord,
        recordStatus: attendanceRecord?.status,
        recordId: attendanceRecord?._id,
        checkInTime: attendanceRecord?.checkIn,
        today: today,
      })

      console.log("=== FINAL STATUS ===")
      console.log("Selected record:", attendanceRecord)
      console.log("Status:", attendanceRecord?.status)
      console.log("Is active:", attendanceRecord?.status === "active")
    } catch (error) {
      console.error("❌ Failed to fetch attendance status:", error)
      setAttendanceStatus(null)
      setDebugInfo({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceStatus()

    // Set up polling every 30 seconds
    const interval = setInterval(() => fetchAttendanceStatus(), 30000)
    return () => clearInterval(interval)
  }, [])

  const handleCheckInClick = () => {
    if (onCheckIn) {
      onCheckIn()
    } else {
      setShowCheckIn(true)
    }
  }

  const handleCheckOutClick = () => {
    if (onCheckOut) {
      onCheckOut()
    } else {
      setShowCheckOut(true)
    }
  }

  const handleCheckInSuccess = () => {
    setTimeout(() => fetchAttendanceStatus(), 1000) // Wait 1 second then refresh
    setShowCheckIn(false)
  }

  const handleCheckOutSuccess = () => {
    setTimeout(() => fetchAttendanceStatus(), 1000) // Wait 1 second then refresh
    setShowCheckOut(false)
  }

  const handleManualRefresh = () => {
    fetchAttendanceStatus(true)
  }

  // Determine attendance status from API response
  const hasNoAttendance = !attendanceStatus
  const isCheckedIn = attendanceStatus?.status === "active"
  const isCheckedOut = attendanceStatus?.status === "checked-out"

  const checkInTime = attendanceStatus?.checkIn
  const checkOutTime = attendanceStatus?.checkOut

  console.log("🔍 Current widget state:", {
    attendanceStatus,
    isCheckedIn,
    isCheckedOut,
    hasNoAttendance,
    status: attendanceStatus?.status,
  })

  // Calculate current work duration for active sessions
  const getCurrentWorkDuration = () => {
    if (!checkInTime || !isCheckedIn) return null

    const checkIn = new Date(checkInTime)
    const now = new Date()
    const diffMs = now.getTime() - checkIn.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHours}h ${diffMinutes}m`
  }

  // Calculate work duration if checked out
  const getWorkDuration = () => {
    if (!checkInTime || !checkOutTime) return null

    const checkIn = new Date(checkInTime)
    const checkOut = new Date(checkOutTime)
    const diffMs = checkOut.getTime() - checkIn.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHours}h ${diffMinutes}m`
  }

  if (compact) {
    // Compact version for TopNavbar
    return (
      <div className="flex items-center gap-2">
        {isLoading ? (
          <div className="text-xs text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              {isCheckedIn ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : isCheckedOut ? (
                <XCircle className="w-4 h-4 text-blue-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs font-medium">
                {attendanceStatus?.status === "active" ? "Checked In" : attendanceStatus?.status === "completed" ? "Checked Out" : attendanceStatus?.status === "checkedOut" ? "Come back tomorrow" : "Not checked in"}
              </span>
              {isCheckedIn && <span className="text-xs text-gray-500">({getCurrentWorkDuration()})</span>}
            </div>

            {hasNoAttendance && (
              <Button
                size="sm"
                onClick={handleCheckInClick}
                className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
              >
                Check In
              </Button>
            )}

            {!hasNoAttendance && !isCheckedOut && (
              <Button
                size="sm"
                onClick={handleCheckOutClick}
                className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6"
              >
                Check Out
              </Button>
            )}

            {/* Debug refresh button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualRefresh}
              className="text-xs px-1 py-1 h-6"
              title="Refresh attendance status"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </>
        )}

        {/* Modals */}
        <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} onSuccess={handleCheckInSuccess} />
        <CheckOutModal
          isOpen={showCheckOut}
          onClose={() => setShowCheckOut(false)}
          onSuccess={handleCheckOutSuccess}
          checkInTime={checkInTime}
        />
      </div>
    )
  }

  // Full widget version
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Attendance
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualRefresh}
              className="text-xs px-2 py-1"
              title="Refresh attendance status"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">Loading attendance status...</div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isCheckedIn
                      ? "bg-green-100 text-green-800"
                      : isCheckedOut
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {hasNoAttendance ? "Not Checked In" : isCheckedIn ? "Checked In" : "Work Day Completed"}
                </div>
              </div>

              {/* Debug Info */}
              {debugInfo && (
                <div className="bg-gray-50 border rounded-lg p-2 text-xs">
                  <div className="font-medium mb-1">Debug Info:</div>
                  <div>All Records: {debugInfo.allRecordsCount}</div>
                  <div>Today Records: {debugInfo.todayRecordsCount}</div>
                  <div>Found Record: {debugInfo.foundRecord ? "Yes" : "No"}</div>
                  <div>Status: {debugInfo.recordStatus || "None"}</div>
                  <div>Record ID: {debugInfo.recordId || "None"}</div>
                  {debugInfo.error && <div className="text-red-600">Error: {debugInfo.error}</div>}
                </div>
              )}

              {/* Check-in Status */}
              {isCheckedIn && checkInTime && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 font-medium">Currently Checked In</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-green-600">Check-in Time:</span>
                        <div className="text-green-800 font-medium">{new Date(checkInTime).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <span className="text-green-600">Duration:</span>
                        <div className="text-green-800 font-medium">{getCurrentWorkDuration()}</div>
                      </div>
                    </div>

                    {attendanceStatus.location && (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3 text-green-600" />
                        <span className="text-green-600 capitalize">Location: {attendanceStatus.location}</span>
                      </div>
                    )}

                    {attendanceStatus.notes && (
                      <div className="text-xs text-green-600">Notes: {attendanceStatus.notes}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Check-out Status */}
              {isCheckedOut && checkInTime && checkOutTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-medium">Work Day Completed</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-blue-600">Check-in:</span>
                        <div className="text-blue-800 font-medium">{new Date(checkInTime).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <span className="text-blue-600">Check-out:</span>
                        <div className="text-blue-800 font-medium">{new Date(checkOutTime).toLocaleTimeString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 text-xs">Total Duration:</span>
                      <span className="text-blue-800 font-semibold text-sm">{getWorkDuration()}</span>
                    </div>

                    {attendanceStatus.location && (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-600 capitalize">Location: {attendanceStatus.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {hasNoAttendance && (
                  <Button onClick={handleCheckInClick} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Clock className="w-4 h-4 mr-2" />
                    Check In
                  </Button>
                )}

                {isCheckedIn && (
                  <Button onClick={handleCheckOutClick} className="flex-1 bg-red-600 hover:bg-red-700">
                    <XCircle className="w-4 h-4 mr-2" />
                    Check Out
                  </Button>
                )}

                {isCheckedOut && (
                  <div className="flex-1 text-center py-3 text-sm text-gray-600 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 mx-auto mb-1 text-green-600" />
                    Work day completed. See you tomorrow!
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} onSuccess={handleCheckInSuccess} />
      <CheckOutModal
        isOpen={showCheckOut}
        onClose={() => setShowCheckOut(false)}
        onSuccess={handleCheckOutSuccess}
        checkInTime={checkInTime}
      />
    </>
  )
}
