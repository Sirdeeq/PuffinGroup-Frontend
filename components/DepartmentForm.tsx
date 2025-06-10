"use client"

import { useState, useEffect } from "react"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"
import type { Department } from "@/types/department"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle, Users } from "lucide-react"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  code: z.string().min(2, {
    message: "Code must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  directorId: z.string().min(1, {
    message: "Director is required for active departments.",
  }),
  isActive: z.boolean(),
})

interface Director {
  _id: string
  firstName: string
  lastName: string
  email: string
  position?: string
}

interface DepartmentFormProps {
  department?: Department
  onClose?: () => void
  onSuccess: () => void
}

export function DepartmentForm({ department, onClose, onSuccess }: DepartmentFormProps) {
  const authContext = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [directorsLoading, setDirectorsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unassignedDirectors, setUnassignedDirectors] = useState<Director[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: department?.name ?? "",
      code: department?.code ?? "",
      description: department?.description ?? "",
      directorId: "",
      isActive: department?.isActive ?? true,
    },
  })

  // Fetch unassigned directors
  useEffect(() => {
    const fetchUnassignedDirectors = async () => {
      try {
        setDirectorsLoading(true)
        const response = await api.getUnassignedDirectors(authContext)

        if (response.success && response.data) {
          setUnassignedDirectors(response.data.directors || [])
        }
      } catch (error) {
        console.error("Error fetching unassigned directors:", error)
        setError("Failed to load available directors")
      } finally {
        setDirectorsLoading(false)
      }
    }

    // Only fetch for new departments (not editing)
    if (!department) {
      fetchUnassignedDirectors()
    } else {
      setDirectorsLoading(false)
    }
  }, [authContext, department])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)
      setError(null)

      if (department) {
        await api.updateDepartment(department.id, values, authContext)
        toast({
          title: "Success",
          description: "Department updated successfully",
        })
      } else {
        // Check if no directors are available
        if (unassignedDirectors.length === 0) {
          toast({
            title: "No Directors Available",
            description: "Please add directors to the system before creating departments",
            variant: "destructive",
          })
          return
        }

        await api.createDepartment(values, authContext)
        toast({
          title: "Success",
          description: "Department created successfully with assigned director",
        })
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save department"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">{department ? "Edit Department" : "Create New Department"}</h2>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Show warning if no directors available for new departments */}
      {!department && !directorsLoading && unassignedDirectors.length === 0 && (
        <Alert variant="destructive">
          <Users className="h-4 w-4" />
          <AlertDescription>
            No unassigned directors available. Please create director accounts before creating departments.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter department name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter department code (e.g., HR, IT)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter department description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Director Selection - Only for new departments */}
          {!department && (
            <FormField
              control={form.control}
              name="directorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Director</FormLabel>
                  <FormControl>
                    {directorsLoading ? (
                      <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading directors...</span>
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a director for this department" />
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
                    )}
                  </FormControl>
                  <FormMessage />
                  {unassignedDirectors.length === 0 && !directorsLoading && (
                    <p className="text-sm text-muted-foreground">
                      No unassigned directors available. All directors are already assigned to departments.
                    </p>
                  )}
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Department</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Active departments can receive files and manage operations
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading || (!department && unassignedDirectors.length === 0)}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {department ? "Updating..." : "Creating..."}
                </>
              ) : department ? (
                "Update Department"
              ) : (
                "Create Department"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
