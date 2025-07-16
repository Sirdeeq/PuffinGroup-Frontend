"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  Save,
  Download,
  RefreshCw,
  PenTool,
  Type,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Crown,
  Shield,
  Star,
  Zap,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"

interface SignatureResponse {
  enabled: boolean
  type: "draw" | "image" | "text"
  data: string
  cloudinaryId?: string
  updatedAt: string
}

export default function SignatureSettingsPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const [userRole, setUserRole] = useState("")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "image" | "text">("draw")
  const [signatureData, setSignatureData] = useState<{
    hasSignature: boolean
    signatureUrl: string
    signatureText: string
    enabled: boolean
    type: "text" | "draw" | "image"
    cloudinaryId?: string
    updatedAt: string
  }>({
    hasSignature: false,
    signatureUrl: "",
    signatureText: "",
    enabled: false,
    type: "text",
    cloudinaryId: undefined,
    updatedAt: "",
  })

  // Fetch user signature on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setLoading(true)
        const role = localStorage.getItem("userRole") || ""
        setUserRole(role)

        // Load user signature status from API
        const signatureResponse = await api.getUserSignature(authContext)
        if (signatureResponse.success) {
          const signature = signatureResponse.data.signature as SignatureResponse
          setSignatureData({
            hasSignature: signature.enabled,
            enabled: signature.enabled,
            type: signature.type === "upload" ? "image" : signature.type,
            signatureUrl:
              signature.type === "draw" || signature.type === "upload" || signature.type === "image"
                ? signature.data
                : "",
            signatureText: signature.type === "text" ? signature.data : "",
            cloudinaryId: signature.cloudinaryId || "",
            updatedAt: signature.updatedAt || "",
          })
          setSignatureMethod(signature.type === "upload" ? "image" : signature.type)

          // If there's a signature URL and it's a draw/image type, load it on canvas
          if (
            signature.enabled &&
            (signature.type === "draw" || signature.type === "upload" || signature.type === "image") &&
            signature.data
          ) {
            setTimeout(() => {
              loadSignatureOnCanvas(signature.data)
            }, 100)
          }
        } else {
          // No signature found, set default text to user's name
          if (userResponse.success && userResponse.data?.user) {
            setSignatureData((prev) => ({
              ...prev,
              signatureText:
                `${userResponse.data.user.firstName || ""} ${userResponse.data.user.lastName || ""}`.trim(),
            }))
          }
        }
      } catch (error) {
        console.error("Error loading signature status:", error)
        toast({
          title: "Error",
          description: "Failed to load signature status. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (authContext.isAuthenticated) {
      initializeComponent()
    }
  }, [authContext, toast])

  useEffect(() => {
    // Initialize canvas when component mounts
    initCanvas()
  }, [])

  const loadSignatureOnCanvas = (imageUrl: string) => {
    const canvas = canvasRef.current
    if (canvas && imageUrl) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          // Scale image to fit canvas while maintaining aspect ratio
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
          const x = (canvas.width - img.width * scale) / 2
          const y = (canvas.height - img.height * scale) / 2
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
        }
        img.onerror = () => {
          console.error("Failed to load signature image")
        }
        img.src = imageUrl
      }
    }
  }

  const getThemeColors = () => {
    switch (user?.role || userRole) {
      case "admin":
        return {
          primary: "#f97316",
          primaryGradient: "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
          secondary: "#fef3c7",
          secondaryGradient: "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)",
          accent: "#f97316",
          text: "#c2410c",
          border: "#fed7aa",
          bg: "#fef3c7",
          icon: Crown,
          name: "Admin",
        }
      case "director":
        return {
          primary: "#ef4444",
          primaryGradient: "linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)",
          secondary: "#fecaca",
          secondaryGradient: "linear-gradient(135deg, #fecaca 0%, #fda4af 100%)",
          accent: "#ef4444",
          text: "#dc2626",
          border: "#fda4af",
          bg: "#fecaca",
          icon: Shield,
          name: "Director",
        }
      case "department":
        return {
          primary: "#10b981",
          primaryGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          secondary: "#d1fae5",
          secondaryGradient: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
          accent: "#10b981",
          text: "#047857",
          border: "#a7f3d0",
          bg: "#d1fae5",
          icon: Star,
          name: "Department",
        }
      default:
        return {
          primary: "#3b82f6",
          primaryGradient: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          secondary: "#dbeafe",
          secondaryGradient: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
          accent: "#3b82f6",
          text: "#1d4ed8",
          border: "#e0e7ff",
          bg: "#dbeafe",
          icon: Zap,
          name: "User",
        }
    }
  }

  const initCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.strokeStyle = "#000000"
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      let x, y
      if ("touches" in e) {
        const rect = canvas.getBoundingClientRect()
        x = e.touches[0].clientX - rect.left
        y = e.touches[0].clientY - rect.top
      } else {
        x = e.nativeEvent.offsetX
        y = e.nativeEvent.offsetY
      }
      ctx.moveTo(x, y)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) {
      let x, y
      if ("touches" in e) {
        const rect = canvas.getBoundingClientRect()
        x = e.touches[0].clientX - rect.left
        y = e.touches[0].clientY - rect.top
      } else {
        x = e.nativeEvent.offsetX
        y = e.nativeEvent.offsetY
      }
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const endDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png")
      setSignatureData((prev) => ({
        ...prev,
        signatureUrl: dataUrl,
        hasSignature: true,
      }))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      setSignatureData((prev) => ({
        ...prev,
        signatureUrl: "",
      }))
    }
  }

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSignatureData((prev) => ({
          ...prev,
          signatureUrl: result,
          hasSignature: true,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignatureSave = async () => {
    try {
      setSaving(true)
      // Prepare payload based on signature method
      const payload: any = {
        enabled: signatureData.hasSignature,
        type: signatureMethod,
      }

      if (signatureMethod === "draw") {
        const canvas = canvasRef.current
        if (canvas) {
          const dataUrl = canvas.toDataURL("image/png")
          payload.data = dataUrl
          // Match the controller's expected field name
          payload.signatureType = "draw"
          payload.signatureData = dataUrl
        } else {
          throw new Error("No signature drawn")
        }
      } else if (signatureMethod === "image" && signatureData.signatureUrl) {
        payload.data = signatureData.signatureUrl
        // Match the controller's expected field name
        payload.signatureType = "image"
        payload.signatureData = signatureData.signatureUrl
      } else if (signatureMethod === "text" && signatureData.signatureText) {
        payload.data = signatureData.signatureText
        // Match the controller's expected field name
        payload.signatureType = "text"
        payload.signatureData = signatureData.signatureText
      } else {
        throw new Error("No valid signature data found")
      }

      // Send to API
      const response = await api.updateUserSignature<SignatureResponse>(payload, authContext)
      if (response.success) {
        // Update local state with response data
        if (response.data) {
          setSignatureData((prev) => ({
            ...prev,
            enabled: response.data.enabled,
            cloudinaryId: response.data.cloudinaryId || undefined,
            updatedAt: response.data.updatedAt,
          }))
        }
        toast({
          title: "Signature updated",
          description: "Your digital signature has been saved successfully",
        })
      } else {
        throw new Error(response.message || "Failed to save signature")
      }
    } catch (error) {
      console.error("Error saving signature:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save signature. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const downloadSignature = () => {
    if (signatureData.signatureUrl) {
      const link = document.createElement("a")
      link.download = "my-signature.png"
      link.href = signatureData.signatureUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const themeColors = getThemeColors()
  const RoleIcon = themeColors.icon

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-slate-600" />
            <div className="absolute inset-0 h-12 w-12 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
          </div>
          <p className="text-slate-600 text-lg">Loading signature settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div
        className="absolute top-20 left-10 w-20 h-20 rounded-full opacity-10 animate-float"
        style={{ background: themeColors.primaryGradient }}
      ></div>
      <div
        className="absolute top-40 right-20 w-16 h-16 rounded-full opacity-10 animate-float-delayed"
        style={{ background: themeColors.primaryGradient }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-12 h-12 rounded-full opacity-10 animate-float"
        style={{ background: themeColors.primaryGradient }}
      ></div>

      <div className="relative z-10 space-y-8 max-w-5xl mx-auto px-6 py-12">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 rounded-2xl shadow-lg" style={{ background: themeColors.primaryGradient }}>
              <RoleIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <Badge className="mb-2" style={{ backgroundColor: themeColors.secondary, color: themeColors.text }}>
                {themeColors.name} Portal
              </Badge>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                E-Signature Settings
              </h1>
            </div>
          </div>
          <p className="text-slate-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Create and manage your digital signature for document approvals with enterprise-grade security
          </p>
        </div>

        {/* Enhanced Signature Status Cards */}
        {signatureData.enabled && (
          <Alert className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <strong className="text-xl">Digital signature is active</strong>
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 px-3 py-1">
                      <PenTool className="w-3 h-3 mr-1" />
                      {signatureData.type}
                    </Badge>
                    {signatureData.updatedAt && (
                      <span className="text-sm text-emerald-700 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Last updated: {new Date(signatureData.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                    <span className="text-sm font-medium">Ready for use</span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!signatureData.enabled && signatureData.updatedAt && (
          <Alert className="border-0 shadow-xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="space-y-2">
                <strong className="text-xl">Digital signature is disabled</strong>
                <div className="text-sm">
                  You have a signature on file but it's currently disabled. Enable it below to use for approvals.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Signature Card */}
        <Card
          className="border-0 shadow-2xl relative overflow-hidden"
          style={{ background: themeColors.secondaryGradient }}
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 transform translate-x-32 -translate-y-32">
            <RoleIcon className="w-full h-full" />
          </div>

          <CardHeader className="pb-8 relative">
            <CardTitle className="flex items-center gap-4 text-3xl">
              <div className="p-4 rounded-2xl text-white shadow-xl" style={{ background: themeColors.primaryGradient }}>
                <PenTool className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  Digital Signature
                  {signatureData.enabled && (
                    <Badge className="text-white shadow-lg" style={{ backgroundColor: themeColors.accent }}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-lg mt-2" style={{ color: themeColors.text }}>
                  Set up your digital signature for document approval and authentication
                </CardDescription>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-10">
            {/* Enable Signature Toggle */}
            <div
              className="flex items-center justify-between p-8 border-2 border-dashed rounded-3xl bg-white/70 backdrop-blur-sm shadow-inner"
              style={{ borderColor: themeColors.border }}
            >
              <div className="space-y-2">
                <Label htmlFor="has-signature" className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: themeColors.accent }} />
                  Enable Digital Signature
                </Label>
                <p className="text-slate-600 text-base">
                  Use digital signature for approvals and document authentication
                </p>
                {signatureData.cloudinaryId && (
                  <p className="text-xs text-slate-500 mt-3 font-mono bg-slate-100 px-2 py-1 rounded">
                    Storage ID: {signatureData.cloudinaryId}
                  </p>
                )}
              </div>
              <Switch
                id="has-signature"
                checked={signatureData.hasSignature}
                onCheckedChange={(checked) => setSignatureData((prev) => ({ ...prev, hasSignature: checked }))}
                className="scale-150"
              />
            </div>

            {signatureData.hasSignature && (
              <>
                {/* Signature Method Tabs */}
                <Tabs value={signatureMethod} onValueChange={(value) => setSignatureMethod(value as any)}>
                  <TabsList className="grid w-full grid-cols-3 h-16 p-2 bg-white/50 backdrop-blur-sm">
                    <TabsTrigger
                      value="draw"
                      className="flex items-center gap-3 text-lg py-3 data-[state=active]:shadow-lg"
                      style={{
                        backgroundColor: signatureMethod === "draw" ? themeColors.accent : "transparent",
                        color: signatureMethod === "draw" ? "white" : "inherit",
                      }}
                    >
                      <PenTool className="w-5 h-5" />
                      Draw
                    </TabsTrigger>
                    <TabsTrigger
                      value="image"
                      className="flex items-center gap-3 text-lg py-3 data-[state=active]:shadow-lg"
                      style={{
                        backgroundColor: signatureMethod === "image" ? themeColors.accent : "transparent",
                        color: signatureMethod === "image" ? "white" : "inherit",
                      }}
                    >
                      <ImageIcon className="w-5 h-5" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="flex items-center gap-3 text-lg py-3 data-[state=active]:shadow-lg"
                      style={{
                        backgroundColor: signatureMethod === "text" ? themeColors.accent : "transparent",
                        color: signatureMethod === "text" ? "white" : "inherit",
                      }}
                    >
                      <Type className="w-5 h-5" />
                      Text
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="draw" className="space-y-8 mt-8">
                    <div className="space-y-6">
                      <Label className="text-2xl font-semibold flex items-center gap-2">
                        <PenTool className="w-6 h-6" style={{ color: themeColors.accent }} />
                        Draw Your Signature
                      </Label>
                      <div
                        className="border-2 border-dashed rounded-3xl p-6 bg-white shadow-2xl"
                        style={{ borderColor: themeColors.border }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={200}
                          className="w-full h-[200px] cursor-crosshair touch-none border-2 border-slate-200 rounded-2xl bg-white shadow-inner"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={endDrawing}
                          onMouseLeave={endDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={endDrawing}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-600 text-lg">
                          Draw your signature in the box above using your mouse or touch
                        </p>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={clearCanvas}
                          className="hover:shadow-lg bg-white/80 backdrop-blur-sm border-2"
                          style={{ borderColor: themeColors.border }}
                        >
                          <RefreshCw className="w-5 h-5 mr-2" />
                          Clear Canvas
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="space-y-8 mt-8">
                    <div className="space-y-6">
                      <Label className="text-2xl font-semibold flex items-center gap-2">
                        <ImageIcon className="w-6 h-6" style={{ color: themeColors.accent }} />
                        Upload Signature Image
                      </Label>
                      <div
                        className="border-2 border-dashed rounded-3xl p-16 text-center bg-white hover:bg-slate-50 transition-all duration-300 shadow-2xl"
                        style={{ borderColor: themeColors.border }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                          id="signature-upload"
                        />
                        <div className="space-y-6">
                          <div
                            className="p-6 rounded-full mx-auto w-fit"
                            style={{ backgroundColor: themeColors.secondary }}
                          >
                            <Upload className="w-16 h-16" style={{ color: themeColors.accent }} />
                          </div>
                          <Button
                            variant="outline"
                            asChild
                            className="text-lg px-8 py-4 hover:shadow-xl bg-white border-2 transition-all duration-300"
                            style={{ borderColor: themeColors.accent, color: themeColors.accent }}
                          >
                            <label htmlFor="signature-upload" className="cursor-pointer">
                              <Upload className="w-5 h-5 mr-3" />
                              Upload Signature Image
                            </label>
                          </Button>
                          <p className="text-slate-500 text-lg">
                            Upload a clear image of your signature (PNG, JPG, max 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-8 mt-8">
                    <div className="space-y-6">
                      <Label htmlFor="signature-text" className="text-2xl font-semibold flex items-center gap-2">
                        <Type className="w-6 h-6" style={{ color: themeColors.accent }} />
                        Signature Text
                      </Label>
                      <Input
                        id="signature-text"
                        placeholder="Enter your signature text"
                        value={signatureData.signatureText}
                        onChange={(e) => setSignatureData((prev) => ({ ...prev, signatureText: e.target.value }))}
                        className="text-2xl h-20 font-script shadow-xl border-2 rounded-2xl bg-white"
                        style={{ fontFamily: "cursive", borderColor: themeColors.border }}
                      />
                      <p className="text-slate-600 text-lg">This text will be used as your digital signature</p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Signature Preview */}
                <div className="space-y-6">
                  <Label className="text-2xl font-semibold flex items-center gap-2">
                    <Sparkles className="w-6 h-6" style={{ color: themeColors.accent }} />
                    Signature Preview
                  </Label>
                  <div className="p-12 border-2 border-slate-300 rounded-3xl text-center bg-white min-h-[160px] flex items-center justify-center shadow-2xl">
                    {signatureMethod === "text" ? (
                      <div className="text-4xl font-script text-slate-800" style={{ fontFamily: "cursive" }}>
                        {signatureData.signatureText || "Your signature will appear here"}
                      </div>
                    ) : signatureData.signatureUrl ? (
                      <img
                        src={signatureData.signatureUrl || "/placeholder.svg"}
                        alt="Signature Preview"
                        className="max-h-32 mx-auto border rounded-2xl shadow-lg"
                      />
                    ) : (
                      <p className="text-slate-500 text-xl">Your signature will appear here</p>
                    )}
                  </div>
                </div>

                {/* Current Signature Info */}
                {signatureData.enabled && signatureData.updatedAt && (
                  <div
                    className="p-8 rounded-3xl border-2 shadow-xl"
                    style={{
                      background: themeColors.secondaryGradient,
                      borderColor: themeColors.border,
                    }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="p-3 rounded-2xl text-white shadow-lg"
                        style={{ backgroundColor: themeColors.accent }}
                      >
                        <Clock className="w-6 h-6" />
                      </div>
                      <Label className="text-2xl font-semibold">Current Signature Information</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md">
                        <span className="text-slate-600 font-medium text-lg">Type:</span>
                        <Badge
                          className="text-lg px-4 py-2"
                          style={{
                            backgroundColor: themeColors.bg,
                            color: themeColors.text,
                            borderColor: themeColors.border,
                          }}
                        >
                          {signatureData.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md">
                        <span className="text-slate-600 font-medium text-lg">Status:</span>
                        <Badge
                          className="text-lg px-4 py-2"
                          style={
                            signatureData.enabled
                              ? {
                                  backgroundColor: themeColors.accent,
                                  color: "white",
                                }
                              : {}
                          }
                        >
                          {signatureData.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md md:col-span-2">
                        <span className="text-slate-600 font-medium text-lg">Last Updated:</span>
                        <span className="text-slate-800 font-medium text-lg">
                          {new Date(signatureData.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      {signatureData.cloudinaryId && (
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md md:col-span-2">
                          <span className="text-slate-600 font-medium text-lg">Storage ID:</span>
                          <span className="font-mono text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                            {signatureData.cloudinaryId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-8 border-t-2 border-slate-200">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={downloadSignature}
                    disabled={!signatureData.signatureUrl && signatureMethod !== "text"}
                    className="hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 text-lg px-8 py-4"
                    style={{ borderColor: themeColors.border }}
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Download Signature
                  </Button>
                  <Button
                    onClick={handleSignatureSave}
                    size="lg"
                    className="text-white hover:shadow-xl transition-all duration-300 text-lg px-12 py-4 shadow-lg"
                    style={{ background: themeColors.primaryGradient }}
                    disabled={saving || (!signatureData.signatureUrl && !signatureData.signatureText)}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-6 h-6 mr-3" />
                        Save Signature
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
