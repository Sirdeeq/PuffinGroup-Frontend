"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from "@/components/logo"
import {
  Building2,
  ChevronRight,
  Loader2,
  Lock,
  LogIn,
  ShieldAlert,
  User,
  Users,
  X,
  AlertCircle,
  Key,
  EyeOff,
  Eye,
} from "lucide-react"
import { CheckInModal } from "@/components/attendance/check-in-modal"

interface LoginCredentials {
  email: string
  password: string
}

type RoleType = "director" | "department" | "admin" | "user"

export default function LoginPage() {
  const { login, isAuthenticated, loading, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null)
  const [showAdminAccess, setShowAdminAccess] = useState(false)
  const [adminKeycode, setAdminKeycode] = useState("")
  const [adminAccessStep, setAdminAccessStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect based on user role from the authenticated user object
      const userRole = user.role

      if (userRole === "admin") {
        router.push("/dashboard")
        return
      }

      // For non-admin users, show check-in modal first (except directors)
      if (userRole !== "director") {
        setShowCheckInModal(true)
      } else {
        // Directors go directly to inbox
        router.push("/dashboard/files/inbox")
      }
    }
  }, [isAuthenticated, loading, user, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-700">Checking authentication status...</p>
        </div>
      </div>
    )
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate inputs
      if (!credentials.email || !credentials.password) {
        throw new Error("Please fill in all fields")
      }

      const response = await login({
        email: credentials.email,
        password: credentials.password,
        role: selectedRole || "department",
      })

      if (response?.success) {
        toast({
          title: "Login successful",
          description:
            response.data.user.role === "admin"
              ? "Redirecting to dashboard..."
              : "Please check in before proceeding...",
        })
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateCredentials = (field: keyof LoginCredentials, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin()
    }
  }

  const handleAdminAccess = () => {
    // This would be a secure company code in a real application
    if (adminKeycode === "PG-ADMIN-2025") {
      setAdminAccessStep(2)
    } else {
      toast({
        title: "Invalid Access Code",
        description: "Please contact your system administrator",
        variant: "destructive",
      })
    }
  }

  const renderRoleSelection = () => (
    <div className="w-full max-w-5xl px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showText={true} />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Welcome to the Document Management System</h1>
        <p className="text-gray-600 text-lg">Please select your role to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Board of Directors Option */}
        <div
          onClick={() => setSelectedRole("director")}
          className="group relative overflow-hidden rounded-2xl bg-white border-2 border-red-200 hover:border-red-300 p-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 p-6 flex flex-col h-full">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Board of Directors</h2>
            <p className="text-gray-600 mb-6">Access director dashboard for approvals and oversight</p>
            <div className="mt-auto flex items-center">
              <Button
                className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 px-5 py-6 text-base font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRole("director")
                }}
              >
                Login as Director
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Department Head Option */}
        <div
          onClick={() => setSelectedRole("department")}
          className="group relative overflow-hidden rounded-2xl bg-white border-2 border-blue-200 hover:border-blue-300 p-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 p-6 flex flex-col h-full">
            <div className="p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Department Head</h2>
            <p className="text-gray-600 mb-6">Access department dashboard for file and request management</p>
            <div className="mt-auto flex items-center">
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 px-5 py-6 text-base font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRole("department")
                }}
              >
                Login as Department Head
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Department User Option */}
        <div
          onClick={() => setSelectedRole("user")}
          className="group relative overflow-hidden rounded-2xl bg-white border-2 border-green-200 hover:border-green-300 p-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 p-6 flex flex-col h-full">
            <div className="p-4 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Department User</h2>
            <p className="text-gray-600 mb-6">Access user dashboard for file and request management</p>
            <div className="mt-auto flex items-center">
              <Button
                className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 px-5 py-6 text-base font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRole("user")
                }}
              >
                Login as Department User
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Admin Access Portal */}
        <div
          onClick={() => setShowAdminAccess(true)}
          className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 p-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 p-6 flex flex-col h-full">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Secure Access Portal</h2>
            <p className="text-gray-600 mb-6">Restricted access for authorized personnel only</p>
            <div className="mt-auto flex items-center">
              <Button
                className="bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2 px-5 py-6 text-base font-medium border border-gray-300"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAdminAccess(true)
                }}
              >
                Secure Access
                <Lock className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Access Modal */}
      {showAdminAccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                Restricted Access
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAdminAccess(false)
                  setAdminAccessStep(0)
                  setAdminKeycode("")
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {adminAccessStep === 0 && (
              <>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    This area is restricted to authorized personnel only. Please enter your company access code to
                    continue.
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Enter company access code"
                      value={adminKeycode}
                      onChange={(e) => setAdminKeycode(e.target.value)}
                      className="bg-gray-50 border-gray-300 text-gray-800"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => handleAdminAccess()} className="bg-orange-600 hover:bg-orange-700 text-white">
                    Verify Access
                  </Button>
                </div>
              </>
            )}

            {adminAccessStep === 2 && (
              <>
                <div className="mb-6">
                  <p className="text-green-600 mb-4 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500"></span>
                    Access granted. Please proceed to administrator login.
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedRole("admin")
                      setShowAdminAccess(false)
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6"
                  >
                    Continue to Admin Login
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderLoginForm = () => {
    const roleConfig = {
      director: {
        title: "Board of Directors",
        description: "Access director dashboard for approvals and oversight",
        icon: Users,
        color: "red",
        placeholder: "director@company.com",
        bgGradient: "from-red-500 to-red-600",
      },
      department: {
        title: "Department Head",
        description: "Access department dashboard for file and request management",
        icon: Building2,
        color: "blue",
        placeholder: "head@department.com",
        bgGradient: "from-blue-500 to-blue-600",
      },
      admin: {
        title: "System Administrator",
        description: "Access administrative dashboard with full system control",
        icon: ShieldAlert,
        color: "orange",
        placeholder: "admin@company.com",
        bgGradient: "from-orange-500 to-orange-600",
      },
      user: {
        title: "Department User",
        description: "Access user dashboard for file and request management",
        icon: User,
        color: "green",
        placeholder: "user@company.com",
        bgGradient: "from-green-500 to-green-600",
      },
    }

    if (!selectedRole) return null

    const config = roleConfig[selectedRole]
    const IconComponent = config.icon

    return (
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" showText={false} />
        </div>

        <div className="rounded-2xl overflow-hidden bg-white shadow-2xl border border-gray-200">
          <div className={`p-8 bg-gradient-to-br ${config.bgGradient}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 rounded-full">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{config.title}</h2>
                <p className="text-white/90 text-sm">{config.description}</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">
                  {selectedRole === "admin" ? "Admin Email" : "Email"}
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={config.placeholder}
                    value={credentials.email}
                    onChange={(e) => updateCredentials("email", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-white/90 border-white/50 text-gray-800 placeholder:text-gray-500 pl-10"
                    disabled={isLoading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {selectedRole === "admin" ? (
                      <Key className="w-4 h-4 text-gray-500" />
                    ) : (
                      <User className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => updateCredentials("password", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-white/90 border-white/50 text-gray-800 pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                className="w-full bg-white text-gray-800 hover:bg-gray-100 py-6 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <Button variant="ghost" className="text-gray-600 hover:bg-gray-100" onClick={() => setSelectedRole(null)}>
              Back to Role Selection
            </Button>
            <p className="text-gray-500 text-xs">Secure Login</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center py-16">
      {selectedRole ? renderLoginForm() : renderRoleSelection()}

      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={() => {
          // After successful check-in, redirect to inbox for all non-admin users
          router.push("/dashboard/files/inbox")
        }}
      />
    </div>
  )
}
