"use client"

import React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Building2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from "@/components/logo"

interface LoginCredentials {
  email: string
  password: string
}

interface Credentials {
  admin: LoginCredentials
  director: LoginCredentials
  department: LoginCredentials
}

export default function LoginPageEnhanced() {
  const { login, isAuthenticated, loading } = useAuth()
  const { toast } = useToast()
  const [credentials, setCredentials] = useState<Credentials>({
    admin: { email: "", password: "" },
    director: { email: "", password: "" },
    department: { email: "", password: "" },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<keyof Credentials | null>(null)

  // If already authenticated, don't render anything (middleware will redirect)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      window.location.href = "/dashboard"
    }
  }, [isAuthenticated, loading])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  const handleLogin = async (role: keyof Credentials) => {
    try {
      setIsLoading(true)
      setError(null)

      const currentCredentials = credentials[role]

      // Validate inputs
      if (!currentCredentials.email || !currentCredentials.password) {
        throw new Error("Please fill in all fields")
      }

      await login({
        email: currentCredentials.email,
        password: currentCredentials.password,
        role,
      })

      toast({
        title: "Login successful",
        description: "Redirecting to dashboard...",
        duration: 3000,
      })
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateCredentials = (role: keyof Credentials, field: keyof LoginCredentials, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent, role: keyof Credentials) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin(role)
    }
  }

  const roleConfigs = {
    admin: {
      title: "Administrator",
      description: "Access administrative dashboard with full system control",
      icon: Shield,
      color: "orange",
      placeholder: "admin@company.com",
    },
    director: {
      title: "Director",
      description: "Access director dashboard for approvals and oversight",
      icon: Users,
      color: "red",
      placeholder: "director@company.com",
    },
    department: {
      title: "Department",
      description: "Access department dashboard for file and request management",
      icon: Building2,
      color: "green",
      placeholder: "user@department.com",
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xxxxxxxl" showText={false} />
          </div>
          <p className="text-slate-600">Choose your role to access the dashboard</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedRole ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(roleConfigs).map(([role, config]) => {
              const IconComponent = config.icon
              return (
                <Card
                  key={role}
                  className={`cursor-pointer transition-all hover:shadow-lg border-${config.color}-200 hover:border-${config.color}-300`}
                  onClick={() => setSelectedRole(role as keyof Credentials)}
                >
                  <CardHeader className={`bg-${config.color}-50 border-b border-${config.color}-200`}>
                    <CardTitle className={`text-${config.color}-800 flex items-center justify-center`}>
                      <IconComponent className="w-8 h-8 mr-3" />
                      {config.title}
                    </CardTitle>
                    <CardDescription className={`text-${config.color}-600 text-center`}>
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <Button
                      className={`w-full bg-${config.color}-500 hover:bg-${config.color}-600`}
                      onClick={() => setSelectedRole(role as keyof Credentials)}
                    >
                      Login as {config.title}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <Card className={`border-${roleConfigs[selectedRole].color}-200 shadow-lg`}>
              <CardHeader
                className={`bg-${roleConfigs[selectedRole].color}-50 border-b border-${roleConfigs[selectedRole].color}-200`}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-${roleConfigs[selectedRole].color}-800 flex items-center`}>
                    {React.createElement(roleConfigs[selectedRole].icon, { className: "w-5 h-5 mr-2" })}
                    {roleConfigs[selectedRole].title} Login
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRole(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Back
                  </Button>
                </div>
                <CardDescription className={`text-${roleConfigs[selectedRole].color}-600`}>
                  {roleConfigs[selectedRole].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${selectedRole}-email`}>Email</Label>
                  <Input
                    id={`${selectedRole}-email`}
                    type="email"
                    placeholder={roleConfigs[selectedRole].placeholder}
                    value={credentials[selectedRole].email}
                    onChange={(e) => updateCredentials(selectedRole, "email", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, selectedRole)}
                    className={`border-${roleConfigs[selectedRole].color}-200 focus:border-${roleConfigs[selectedRole].color}-500`}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${selectedRole}-password`}>Password</Label>
                  <Input
                    id={`${selectedRole}-password`}
                    type="password"
                    value={credentials[selectedRole].password}
                    onChange={(e) => updateCredentials(selectedRole, "password", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, selectedRole)}
                    className={`border-${roleConfigs[selectedRole].color}-200 focus:border-${roleConfigs[selectedRole].color}-500`}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={() => handleLogin(selectedRole)}
                  className={`w-full bg-${roleConfigs[selectedRole].color}-500 hover:bg-${roleConfigs[selectedRole].color}-600`}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : `Login as ${roleConfigs[selectedRole].title}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
