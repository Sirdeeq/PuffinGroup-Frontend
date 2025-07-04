"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"
import { Clock, Loader2 } from "lucide-react"

interface CheckOutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  checkInTime?: string
}

export function CheckOutModal({ isOpen, onClose, onSuccess, checkInTime }: CheckOutModalProps) {
  const [notes, setNotes] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const authContext = useAuth()

  const handleCheckOut = async () => {
    try {
      setIsLoading(true)

      const checkOutData = {
        notes,
        checkOutTime: new Date().toISOString(),
      }

      const response = await api.checkOut(checkOutData, authContext)

      if (response.success) {
        toast({
          title: "Check-out Successful",
          description: `Checked out at ${new Date().toLocaleTimeString()}`,
        })
        onSuccess()
        onClose()
        setNotes("")
      }
    } catch (error: any) {
      console.error("Check-out error:", error)
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to check out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateWorkDuration = () => {
    if (!checkInTime) return "Unknown"

    const checkIn = new Date(checkInTime)
    const now = new Date()
    const diffMs = now.getTime() - checkIn.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHours}h ${diffMinutes}m`
  }

  const handleClose = () => {
    setNotes("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" />
            Check Out
          </DialogTitle>
          <DialogDescription>Complete your attendance for today</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {checkInTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-700 font-medium">Check-in Time:</span>
                  <span className="text-blue-800">{new Date(checkInTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Work Duration:</span>
                  <span className="text-blue-800 font-semibold">{calculateWorkDuration()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="checkout-notes">End of Day Notes (Optional)</Label>
            <Textarea
              id="checkout-notes"
              placeholder="Summarize your work for today, any pending tasks, or notes for tomorrow..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Check-out time: {new Date().toLocaleString()}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCheckOut} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking Out...
              </>
            ) : (
              "Check Out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
