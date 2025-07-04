"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AttendanceRecord {
  _id: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface AttendanceResponse {
  success: boolean;
  data: AttendanceRecord[];
}
import { CheckInModal } from "./check-in-modal"
import { CheckOutModal } from "./check-out-modal"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { Clock, Calendar, CheckCircle, XCircle, MapPin, RefreshCw } from "lucide-react"
import { toast } from "sonner";

interface AttendanceWidgetProps {
  onCheckIn?: () => void
  onCheckOut?: () => void
  compact?: boolean
}

export function AttendanceWidget({ onCheckIn, onCheckOut, compact = false }: AttendanceWidgetProps) {
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showCheckOut, setShowCheckOut] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceRecord | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const authContext = useAuth()


  // Fetch inbox files
    const fetchAttendanceHistory = async () => {
      try {
        console.log("Fetching attendance history...")
        setLoading(true)
        const response = await api.getAttendanceHistory(authContext)
        
        if (!response.success) {
          console.error("API response not successful:", response)
          throw new Error("API request failed")
        }

        // If response.data is undefined or not an array, throw error
        if (!response.data.data || !Array.isArray(response.data.data)) {
          console.error("Invalid response data format:", response)
          throw new Error("Invalid response format")
        }

        const attendanceRecords = response.data.data as AttendanceRecord[]
        console.log("Received records:", attendanceRecords)

        const todayRecords = attendanceRecords.filter((record: AttendanceRecord) => {
          if (!record.checkIn) return false
          const recordDate = new Date(record.checkIn).toISOString().split("T")[0]
          const today = new Date().toISOString().split("T")[0]
          return recordDate === today
        })

        console.log("Filtered today's records:", todayRecords)
        
        // Set the most recent record as the attendance status
        if (todayRecords.length > 0) {
          const sortedRecords = todayRecords.sort((a: AttendanceRecord, b: AttendanceRecord) => 
            new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
          )
          setAttendanceStatus(sortedRecords[0])
        } else {
          setAttendanceStatus(null)
        }
        
        setAttendanceData(todayRecords)
        setLoading(false)
        
        // Update debug info
        setDebugInfo({
          apiSuccess: response.success,
          todayRecordsCount: todayRecords.length,
          foundRecord: !!attendanceStatus,
          recordStatus: attendanceStatus?.status,
          recordId: attendanceStatus?._id,
          checkInTime: attendanceStatus?.checkIn,
          hasCompletedTodaySession: attendanceStatus?.status === "checked-out",
          today: new Date().toISOString().split("T")[0],
          rawResponse: response
        })
      } catch (error) {
        console.error("Error fetching attendance history:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load attendance history",
          variant: "destructive",
        })
        setLoading(false)
      } finally {
        // Ensure loading is always false at the end
        if (loading) {
          setLoading(false)
        }
      }
    }
  
    useEffect(() => {
        fetchAttendanceHistory()
    }, [authContext])
  

//   const fetchAttendanceStatus = async (showDebug = false) => {
//     try {
//       setIsLoading(true)

//       console.log("=== FETCHING ATTENDANCE STATUS ===")

//       // Get today's date for filtering
//       const today = new Date().toISOString().split("T")[0]
//       console.log("Today's date:", today)

//       // Get today's records only
//       const todayRecordsResponse = await api.getAttendanceHistory({ date: today }, authContext)
//       console.log("Today's records response:", todayRecordsResponse)

//       let attendanceRecord = null
//       let hasCompletedTodaySession = false

//       // Fix: Check the correct response structure
//       if (todayRecordsResponse.success && todayRecordsResponse.data && todayRecordsResponse.data.length > 0) {
//         const todayRecords = todayRecordsResponse.data

//         console.log("Today's records found:", todayRecords.length)

//         // Sort records by check-in time (most recent first)
//         const sortedRecords = todayRecords.sort(
//           (a: any, b: any) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime(),
//         )

//         console.log("Sorted records:", sortedRecords)

//         // Get the most recent record from today
//         attendanceRecord = sortedRecords[0]

//         // Check if this record is checked-out
//         hasCompletedTodaySession = attendanceRecord.status === "checked-out"

//         console.log(`✅ Found today's record:`, {
//           id: attendanceRecord._id,
//           status: attendanceRecord.status,
//           checkIn: attendanceRecord.checkIn,
//           checkOut: attendanceRecord.checkOut,
//         })
//       } else {
//         console.log("❌ No today's records found or API call failed")
//       }

//       setAttendanceStatus(attendanceRecord)

//       // Set debug info
//       setDebugInfo({
//         todayRecordsCount: Array.isArray(todayRecordsResponse.data) ? todayRecordsResponse.data.length : 0,
//         foundRecord: !!attendanceRecord,
//         recordStatus: attendanceRecord?.status,
//         recordId: attendanceRecord?._id,
//         checkInTime: attendanceRecord?.checkIn,
//         hasCompletedTodaySession,
//         today: today,
//         apiSuccess: todayRecordsResponse.success,
//         rawResponse: todayRecordsResponse as AttendanceResponse,
//       })

//       console.log("=== FINAL STATUS ===")
//       console.log("Selected record:", attendanceRecord)
//       console.log("Status:", attendanceRecord?.status)
//       console.log("Has completed today session:", hasCompletedTodaySession)
//     } catch (error: unknown) {
//       console.error("❌ Failed to fetch attendance status:", error)
//       setAttendanceStatus(null)
//       setDebugInfo({ error: error instanceof Error ? error.message : String(error) })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchAttendanceStatus()

//     // Set up polling every 30 seconds
//     const interval = setInterval(() => fetchAttendanceStatus(), 30000)
//     return () => clearInterval(interval)
//   }, [])

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
    setTimeout(() => fetchAttendanceStatus(), 1000)
    setShowCheckIn(false)
  }

  const handleCheckOutSuccess = () => {
    setTimeout(() => fetchAttendanceStatus(), 1000)
    setShowCheckOut(false)
  }

  const handleManualRefresh = () => {
    fetchAttendanceHistory(true)
  }

  // Determine attendance status
  const isCheckedIn = attendanceStatus?.status === "active"
  console.log("isCheckedIn", isCheckedIn)

  const isCheckedOut = attendanceStatus?.status === "checked-out"
  const hasNoAttendance = !attendanceStatus

  // Check if this is today's record
  const isToday = attendanceStatus?.checkIn
    ? new Date(attendanceStatus.checkIn).toISOString().split("T")[0] === new Date().toISOString().split("T")[0]
    : false

  // If user has checked out today, they should come back tomorrow
  const hasCompletedTodayWork = isCheckedOut && isToday

  const checkInTime = attendanceStatus?.checkIn
  const checkOutTime = attendanceStatus?.checkOut

  console.log("🔍 Current widget state:", {
    attendanceStatus,
    isCheckedIn,
    isCheckedOut,
    hasNoAttendance,
    isToday,
    hasCompletedTodayWork,
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
        {loading ? (
          <div className="text-xs text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              {hasCompletedTodayWork ? (
                <CheckCircle className="w-4 h-4 text-purple-600" />
              ) : isCheckedIn ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : isCheckedOut ? (
                <XCircle className="w-4 h-4 text-blue-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs font-medium">
                {hasCompletedTodayWork
                  ? "Come back tomorrow"
                  : isCheckedIn
                    ? "Checked In"
                    : isCheckedOut
                      ? "Checked Out"
                      : "Not Checked In"}
              </span>
              {isCheckedIn && <span className="text-xs text-gray-500">({getCurrentWorkDuration()})</span>}
              {isCheckedOut && <span className="text-xs text-gray-500">({getWorkDuration()})</span>}
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

            {isCheckedIn && (
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
          {loading ? (
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
                      : hasCompletedTodayWork
                        ? "bg-purple-100 text-purple-800"
                        : isCheckedOut
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isCheckedIn
                    ? "Checked In"
                    : hasCompletedTodayWork
                      ? "Work Complete"
                      : isCheckedOut
                        ? "Checked Out"
                        : "Not Checked In"}
                </div>
              </div>

              {/* Debug Info */}
              {debugInfo && (
                <div className="bg-gray-50 border rounded-lg p-2 text-xs">
                  <div className="font-medium mb-1">Debug Info:</div>
                  <div>API Success: {debugInfo.apiSuccess ? "Yes" : "No"}</div>
                  <div>Today Records: {debugInfo.todayRecordsCount}</div>
                  <div>Found Record: {debugInfo.foundRecord ? "Yes" : "No"}</div>
                  <div>Status: {debugInfo.recordStatus || "None"}</div>
                  <div>Has Completed Today: {debugInfo.hasCompletedTodaySession ? "Yes" : "No"}</div>
                  <div>Record ID: {debugInfo.recordId || "None"}</div>
                  {debugInfo.error && <div className="text-red-600">Error: {debugInfo.error}</div>}

                  {/* Raw data for debugging */}
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Raw API Response</summary>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(debugInfo.rawResponse, null, 2)}
                    </pre>
                  </details>
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

              {/* Today's Work Completed Status */}
              {hasCompletedTodayWork && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-800 font-medium">Today's Work Completed</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-purple-600">Check-in:</span>
                        <div className="text-purple-800 font-medium">{new Date(checkInTime).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <span className="text-purple-600">Check-out:</span>
                        <div className="text-purple-800 font-medium">{new Date(checkOutTime).toLocaleTimeString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-purple-600 text-xs">Total Duration:</span>
                      <span className="text-purple-800 font-semibold text-sm">{getWorkDuration()}</span>
                    </div>

                    {attendanceStatus.location && (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3 text-purple-600" />
                        <span className="text-purple-600 capitalize">Location: {attendanceStatus.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Check-out Status (for previous days) */}
              {isCheckedOut && !isToday && checkInTime && checkOutTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-medium">Previous Work Session</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-blue-600">Date:</span>
                        <div className="text-blue-800 font-medium">{new Date(checkInTime).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-blue-600">Duration:</span>
                        <div className="text-blue-800 font-medium">{getWorkDuration()}</div>
                      </div>
                    </div>
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

                {hasCompletedTodayWork && (
                  <div className="flex-1 text-center py-3 text-sm text-gray-600 bg-purple-50 rounded-lg border border-purple-200">
                    <CheckCircle className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <div className="text-purple-800 font-medium">Work day completed!</div>
                    <div className="text-purple-600 text-xs">See you tomorrow</div>
                  </div>
                )}

                {isCheckedOut && !isToday && (
                  <Button onClick={handleCheckInClick} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Clock className="w-4 h-4 mr-2" />
                    Check In for Today
                  </Button>
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
