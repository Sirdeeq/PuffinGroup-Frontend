"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { MapPin, Clock, AlertTriangle, Loader2, X } from "lucide-react"

interface CheckInModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CheckInModal({ isOpen, onClose, onSuccess }: CheckInModalProps) {
  const [location, setLocation] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLocationError, setShowLocationError] = useState(false)
  const { toast } = useToast()
  const authContext = useAuth()

  const handleCheckIn = async (skipLocationCheck = false) => {
    try {
      setIsLoading(true)
      setShowLocationError(false)

      const checkInData = {
        location: location || "remote",
        notes,
        skipLocationCheck,
      }

      const response = await api.checkIn(checkInData, authContext)

      if (response.success) {
        toast({
          title: "Check-in Successful",
          description: `Checked in at ${new Date().toLocaleTimeString()}`,
        })
        onSuccess()
        onClose()
        resetForm()
      }
    } catch (error: any) {
      console.error("Check-in error:", error)

      // Handle location validation error
      if (error.message?.includes("Invalid location") || error.message?.includes("office network")) {
        setShowLocationError(true)
      } else {
        toast({
          title: "Check-in Failed",
          description: error.message || "Failed to check in. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipCheckIn = () => {
    toast({
      title: "Skipped Check-in",
      description: "You can check in later from the dashboard.",
      variant: "default",
    })
    onSuccess()
    onClose()
  }

  const resetForm = () => {
    setLocation("")
    setNotes("")
    setShowLocationError(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleLocationErrorClose = () => {
    setShowLocationError(false)
    // Keep the location as "office" - don't reset it
  }

  return (
    <>
      {/* Main Check-in Modal */}
      <Dialog open={isOpen && !showLocationError} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Check In
            </DialogTitle>
            <DialogDescription>Record your attendance for today</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about your work location or schedule..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Current time: {new Date().toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSkipCheckIn}
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200"
              disabled={isLoading}
            >
              Skip & Continue
            </Button>
            <Button
              onClick={() => handleCheckIn(false)}
              disabled={isLoading || !location}
              className="ml-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking In...
                </>
              ) : (
                "Check In"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Error Modal */}
      <Dialog open={showLocationError} onOpenChange={handleLocationErrorClose}>
        <DialogContent className="sm:max-w-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Office Network Required
            </DialogTitle>
            <DialogDescription>
              You must be connected to the office network to check in from the office location.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Office Check-in Requirements:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Must be physically present at the office</li>
                    <li>• Must be connected to the office WiFi network</li>
                    <li>• Contact IT support if you're having network connectivity issues</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Current Status:</h4>
                  <p className="text-sm text-amber-700">
                    Your current network connection does not match our office network. Please ensure you are connected
                    to the office WiFi.
                  </p>
                </div>
              </div>
            </div>

            {/* <div className="text-center">
              <p className="text-sm text-gray-600">
                If you're working remotely today, please close this dialog and select "Remote/Home" as your location.
              </p>
            </div> */}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {/* <Button variant="outline" onClick={handleLocationErrorClose} className="w-full sm:w-auto bg-transparent">
              <X className="w-4 h-4 mr-2" />
              Close & Change Location
            </Button> */}
            <Button
              onClick={() => handleCheckIn(true)}
              disabled={isLoading}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Check In"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
