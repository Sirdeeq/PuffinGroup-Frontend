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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle, Users, Building2, UserCheck, Mail, Shield } from "lucide-react"
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
  director: z.string().min(1, {
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
  department?: Array<{
    _id: string
    name: string
    code: string
  }>
  isActive: boolean
  lastLogin?: string
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
  const [allDirectors, setAllDirectors] = useState<Director[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: department?.name ?? "",
      code: department?.code ?? "",
      description: department?.description ?? "",
      director: "",
      isActive: department?.isActive ?? true,
    },
  })

  // Fetch directors
  useEffect(() => {
    const fetchDirectors = async () => {
      try {
        setDirectorsLoading(true)
        setError(null)
        const response = await api.getAllDirectors(authContext)

        if (response.success && response.data) {
          // Process directors from the response
          const directors = Array.isArray(response.data.directors) ? response.data.directors : []
          setAllDirectors(directors)
        } else {
          // If no directors found, still set an empty array
          setAllDirectors([])
        }
      } catch (error) {
        console.error("Error fetching directors:", error)
        setError("Failed to load directors. Please try again.")
        setAllDirectors([])
      } finally {
        setDirectorsLoading(false)
      }
    }

    // Only fetch for new departments (not editing)
    if (!department) {
      fetchDirectors()
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

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return "Never"
    return new Date(lastLogin).toLocaleDateString()
  }

  const getDirectorStatus = (director: Director) => {
    if (director.department && director.department.length > 0) {
      return {
        isAssigned: true,
        departmentName: director.department[0].name,
        departmentCode: director.department[0].code,
      }
    }
    return { isAssigned: false }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl">{department ? "Edit Department" : "Create New Department"}</CardTitle>
          </div>
          <CardDescription>
            {department
              ? "Update department information and settings"
              : "Set up a new department with an assigned director"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Directors Summary */}
          {!department && !directorsLoading && allDirectors.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>General Directors Available</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{allDirectors.length}</div>
                  <div className="text-xs text-muted-foreground">Total Directors</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>Department Name</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Human Resources" />
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
                      <FormLabel className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Department Code</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., HR, IT, FIN" className="uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the department's role and responsibilities..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Director Selection - Only for new departments */}
              {!department && (
                <FormField
                  control={form.control}
                  name="director"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4" />
                        <span>Assign Director</span>
                      </FormLabel>
                      <FormControl>
                        {directorsLoading ? (
                          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading directors...</span>
                          </div>
                        ) : (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-auto min-h-[44px]">
                              <SelectValue placeholder="Select a director for this department" />
                            </SelectTrigger>
                            <SelectContent>
                              {allDirectors.map((director) => {
                                const status = getDirectorStatus(director)
                                return (
                                  <SelectItem key={director._id} value={director._id} className="p-3">
                                    <div className="flex items-start space-x-3 w-full">
                                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <UserCheck className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-sm">
                                            {director.firstName} {director.lastName}
                                          </span>
                                          {director.isActive && (
                                            <Badge variant="secondary" className="text-xs">
                                              Active
                                            </Badge>
                                          )}
                                          {status.isAssigned && (
                                            <Badge variant="outline" className="text-xs">
                                              Assigned to {status.departmentCode}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-1 mt-1">
                                          <Mail className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground truncate">
                                            {director.email}
                                          </span>
                                        </div>
                                        {director.position && (
                                          <div className="text-xs text-muted-foreground mt-1">{director.position}</div>
                                        )}
                                        {status.isAssigned && (
                                          <div className="text-xs text-amber-600 mt-1">
                                            Currently assigned to {status.departmentName}
                                          </div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Last login: {formatLastLogin(director.lastLogin)}
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
                      <FormMessage />
                      {allDirectors.length === 0 && !directorsLoading && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          No directors found. Please create director accounts first.
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              )}

              <Separator />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">Active Department</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Active departments can receive files and manage operations
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-6">
                {onClose && (
                  <Button variant="outline" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={loading} className="min-w-[120px]">
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
        </CardContent>
      </Card>
    </div>
  )
}
