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
  Sparkles,
  Zap,
  Crown,
  Shield,
  Star,
  Rocket,
  FileText,
  BarChart3,
  Cloud,
} from "lucide-react"
import { CheckInModal } from "@/components/attendance/check-in-modal"

interface LoginCredentials {
  email: string
  password: string
}

type RoleType = "director" | "department" | "admin" | "user"

// Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white/10 animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// Animated background component
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/30 to-red-500/30 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "4s" }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
    </div>
  )
}

// Feature showcase component
const FeatureShowcase = () => {
  const features = [
    {
      icon: FileText,
      title: "Smart Document Management",
      description: "AI-powered organization and instant search",
      color: "from-blue-500 to-cyan-500",
      delay: "0s",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Live insights and performance metrics",
      color: "from-purple-500 to-pink-500",
      delay: "0.5s",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance",
      color: "from-green-500 to-emerald-500",
      delay: "1s",
    },
    {
      icon: Cloud,
      title: "Cloud Integration",
      description: "Seamless sync across all devices",
      color: "from-orange-500 to-red-500",
      delay: "1.5s",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-6 mb-12">
      {features.map((feature, index) => {
        const IconComponent = feature.icon
        return (
          <div
            key={index}
            className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105"
            style={{ animationDelay: feature.delay }}
          >
            <div
              className={`inline-flex p-3 bg-gradient-to-br ${feature.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}
            >
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
            <p className="text-white/70 text-sm">{feature.description}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function StunningLoginPage() {
  const { login, isAuthenticated, loading, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null)
  const [showAdminAccess, setShowAdminAccess] = useState(false)
  const [adminKeycode, setAdminKeycode] = useState("")
  const [adminAccessStep, setAdminAccessStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Trigger animations on mount
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Simple redirect function
  const redirectUser = (userRole: string) => {
    console.log("Redirecting user with role:", userRole)
    if (userRole === "admin") {
      window.location.href = "/dashboard"
      return
    }
    if (userRole === "director") {
      window.location.href = "/dashboard/files/inbox"
      return
    }
    if (userRole === "department" || userRole === "user") {
      setShowCheckInModal(true)
      return
    }
    window.location.href = "/dashboard/files/inbox"
  }

  // Handle existing authentication
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      console.log("User already authenticated:", user.role)
      redirectUser(user.role)
    }
  }, [isAuthenticated, loading, user])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-orange-400" />
            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-orange-400/20" />
          </div>
          <p className="mt-6 text-white/80 text-lg">Initializing Puffin Portal...</p>
        </div>
      </div>
    )
  }

  const handleLogin = async () => {
    try {
      setIsLogging(true)
      setError(null)
      if (!credentials.email || !credentials.password) {
        throw new Error("Please fill in all fields")
      }
      console.log("Attempting login...")
      const response = await login({
        email: credentials.email,
        password: credentials.password,
        role: selectedRole || "department",
      })
      if (response?.success) {
        const userRole = response.data.user.role
        console.log("Login successful, user role:", userRole)
        toast({
          title: "Login successful",
          description: "Redirecting...",
        })
        setTimeout(() => {
          redirectUser(userRole)
        }, 1000)
      }
    } catch (err: any) {
      console.error("Login error:", err)
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLogging(false)
    }
  }

  const updateCredentials = (field: keyof LoginCredentials, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (error) setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLogging) {
      handleLogin()
    }
  }

  const handleAdminAccess = () => {
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

  const handleCheckInSuccess = () => {
    setShowCheckInModal(false)
    window.location.href = "/dashboard/files/inbox"
  }

  const renderRoleSelection = () => (
    <div
      className={`w-full max-w-2xl transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
    >
      {/* Logo and Welcome */}
      <div className="text-center mb-16">
        <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
          <Logo size="xxxxxl" showText={false} />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
            Welcome to Puffin Portal
          </h1>
          {/* <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Experience the future of document management with our revolutionary platform
          </p> */}
        </div>
      </div>

      {/* Login Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Staff Portal */}
        <div
          onClick={() => setSelectedRole("department")}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border border-white/20 p-1 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
              Staff Portal
            </h2>
            <p className="text-white/80 mb-8 leading-relaxed">
              Comprehensive access for directors, department heads, and team members
            </p>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedRole("department")
              }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Enter Portal
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Admin Portal */}
        <div
          onClick={() => setShowAdminAccess(true)}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-xl border border-white/20 p-1 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex p-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Crown className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors duration-300">
              Admin Command
            </h2>
            <p className="text-white/80 mb-8 leading-relaxed">
              Elite access for system administrators with supreme control
            </p>
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105"
              onClick={(e) => {
                e.stopPropagation()
                setShowAdminAccess(true)
              }}
            >
              <Zap className="w-5 h-5 mr-2" />
              Secure Access
              <Lock className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Showcase
      <FeatureShowcase /> */}

      {/* Admin Access Modal */}
      {showAdminAccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-orange-500/30 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                Elite Access
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAdminAccess(false)
                  setAdminAccessStep(0)
                  setAdminKeycode("")
                }}
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {adminAccessStep === 0 && (
              <>
                <div className="mb-8">
                  <p className="text-white/80 mb-6 leading-relaxed">
                    This portal requires elite clearance. Enter your executive access code to proceed.
                  </p>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Executive Access Code"
                      value={adminKeycode}
                      onChange={(e) => setAdminKeycode(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-14 rounded-2xl backdrop-blur-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => handleAdminAccess()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl"
                >
                  <Key className="w-5 h-5 mr-2" />
                  Verify Clearance
                </Button>
              </>
            )}

            {adminAccessStep === 2 && (
              <>
                <div className="mb-8 text-center">
                  <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-4">
                    <Star className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-green-400 mb-6 text-lg font-semibold">
                    Clearance Granted. Welcome, Administrator.
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedRole("admin")
                      setShowAdminAccess(false)
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Launch Admin Console
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
        description: "Executive dashboard with supreme oversight",
        icon: Crown,
        bgGradient: "from-blue-500 to-purple-600",
        placeholder: "director@puffingroup.com",
      },
      department: {
        title: "Staff Portal",
        description: "Your gateway to productivity and collaboration",
        icon: Users,
        bgGradient: "from-blue-500 to-purple-600",
        placeholder: "staff@puffingroup.com",
      },
      admin: {
        title: "Admin Command Center",
        description: "Supreme control over the entire ecosystem",
        icon: Crown,
        bgGradient: "from-orange-500 to-red-600",
        placeholder: "admin@puffingroup.com",
      },
      user: {
        title: "Team Member Portal",
        description: "Streamlined access to your workspace",
        icon: User,
        bgGradient: "from-green-500 to-teal-600",
        placeholder: "user@puffingroup.com",
      },
    }

    if (!selectedRole) return null
    const config = roleConfig[selectedRole]
    const IconComponent = config.icon

    return (
      <div
        className={`w-full max-w-lg transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <Logo size="xxxxxxxl" showText={false} />
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl border border-white/20">
          <div className={`p-8 bg-gradient-to-br ${config.bgGradient} relative overflow-hidden`}>
            <AnimatedBackground />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-xl">
                  <IconComponent className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">{config.title}</h2>
                  <p className="text-white/90">{config.description}</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-200 backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-white text-sm font-semibold">
                    {selectedRole === "admin" ? "Admin Email" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={config.placeholder}
                      value={credentials.email}
                      onChange={(e) => updateCredentials("email", e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 pl-14 h-14 rounded-2xl focus:bg-white/20 transition-all duration-300"
                      disabled={isLogging}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      {selectedRole === "admin" ? (
                        <Key className="w-6 h-6 text-white/70" />
                      ) : (
                        <User className="w-6 h-6 text-white/70" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-semibold">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your secure password"
                      value={credentials.password}
                      onChange={(e) => updateCredentials("password", e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 pl-14 pr-14 h-14 rounded-2xl focus:bg-white/20 transition-all duration-300"
                      disabled={isLogging}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <Lock className="w-6 h-6 text-white/70" />
                    </div>
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-200"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  className="w-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 py-4 font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/30 hover:scale-105"
                  disabled={isLogging}
                >
                  {isLogging ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <LogIn className="w-6 h-6" />
                      <span>Access Portal</span>
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-black/20 backdrop-blur-sm flex justify-between items-center">
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-2xl"
              onClick={() => setSelectedRole(null)}
              disabled={isLogging}
            >
              ← Back to Selection
            </Button>
            <p className="text-white/60 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secured by Puffin
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Main Content */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {selectedRole ? renderLoginForm() : renderRoleSelection()}
      </div>

      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={handleCheckInSuccess}
      />
    </div>
  )
}
