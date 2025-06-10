"use client"

import { useState, useEffect } from "react"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users, AlertTriangle } from "lucide-react"

interface Director {
  _id: string
  firstName: string
  lastName: string
  email: string
  position?: string
}

interface Department {
  _id: string
  name: string
  code: string
}

interface AssignDirectorDialogProps {
  department: Department
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AssignDirectorDialog({ department, open, onOpenChange, onSuccess }: AssignDirectorDialogProps) {
  const authContext = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [directorsLoading, setDirectorsLoading] = useState(true)
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>("")
  const [unassignedDirectors, setUnassignedDirectors] = useState<Director[]>([])

  // Fetch unassigned directors when dialog opens
  useEffect(() => {
    if (open) {
      fetchUnassignedDirectors()
    }
  }, [open])

  const fetchUnassignedDirectors = async () => {
    try {
      setDirectorsLoading(true)
      const response = await api.getUnassignedDirectors(authContext)

      if (response.success && response.data) {
        setUnassignedDirectors(response.data.directors || [])
      }
    } catch (error) {
      console.error("Error fetching unassigned directors:", error)
      toast({
        title: "Error",
        description: "Failed to load available directors",
        variant: "destructive",
      })
    } finally {
      setDirectorsLoading(false)
    }
  }

  const handleAssignDirector = async () => {
    if (!selectedDirectorId) {
      toast({
        title: "Selection Required",
        description: "Please select a director to assign",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await api.assignDirectorToDepartment(
        department._id,
        selectedDirectorId,
        authContext,
      )

      if (response.success) {
        toast({
          title: "Success",
          description: "Director assigned successfully",
        })
        onSuccess()
        onOpenChange(false)
        setSelectedDirectorId("")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign director",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Director</DialogTitle>
          <DialogDescription>Assign a director to manage the {department.name} department</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {directorsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading available directors...</span>
            </div>
          ) : unassignedDirectors.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No unassigned directors available. All directors are already assigned to departments.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Director</label>
                <Select value={selectedDirectorId} onValueChange={setSelectedDirectorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a director" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedDirectors.map((director) => (
                      <SelectItem key={director._id} value={director._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {director.firstName} {director.lastName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {director.email} {director.position && `• ${director.position}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  The selected director will be responsible for managing this department and its operations.
                </AlertDescription>
              </Alert>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignDirector}
              disabled={loading || !selectedDirectorId || unassignedDirectors.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Director"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
