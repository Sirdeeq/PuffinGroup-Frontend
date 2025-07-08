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
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"

interface SignatureResponse {
  enabled: boolean
  type: "draw" | "upload" | "text"
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
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "upload" | "text">("draw")
  const [signatureData, setSignatureData] = useState<{
    hasSignature: boolean;
    signatureUrl: string;
    signatureText: string;
    enabled: boolean;
    type: "text" | "draw" | "upload";
    cloudinaryId?: string;
    updatedAt: string;
  }>({
    hasSignature: false,
    signatureUrl: "",
    signatureText: "",
    enabled: false,
    type: "text" as "text",
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

        // Load user data
        const userResponse = await api.getUser(authContext)
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data)
        }

        // Load user signature status from API
        const signatureResponse = await api.getUserSignature(authContext)

        if (signatureResponse.success && signatureResponse.signature) {
          const signature = signatureResponse.signature as SignatureResponse

          setSignatureData({
            hasSignature: signature.enabled,
            enabled: signature.enabled,
            type: signature.type,
            signatureUrl: signature.type === "draw" || signature.type === "upload" ? signature.data : "",
            signatureText: signature.type === "text" ? signature.data : "",
            cloudinaryId: signature.cloudinaryId || "",
            updatedAt: signature.updatedAt || "",
          })

          setSignatureMethod(signature.type)

          // If there's a signature URL and it's a draw/upload type, load it on canvas
          if (signature.enabled && (signature.type === "draw" || signature.type === "upload") && signature.data) {
            setTimeout(() => {
              loadSignatureOnCanvas(signature.data)
            }, 100)
          }
        } else {
          // No signature found, set default text to user's name
          if (userResponse.success && userResponse.data) {
            setSignatureData((prev) => ({
              ...prev,
              signatureText: `${userResponse.data.firstName || ""} ${userResponse.data.lastName || ""}`.trim(),
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

  const getThemeColor = () => {
    switch (userRole) {
      case "admin":
        return "orange"
      case "director":
        return "red"
      case "department":
        return "green"
      default:
        return "blue"
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
      } else if (signatureMethod === "upload" && signatureData.signatureUrl) {
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

  const themeColor = getThemeColor()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading signature settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">E-Signature Settings</h1>
        <p className="text-slate-600 mt-1">Create and manage your digital signature for document approvals</p>
      </div>

      {/* Signature Status Card */}
      {signatureData.enabled && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Digital signature is active</strong>
                <div className="text-sm mt-1">
                  Type:{" "}
                  <Badge variant="outline" className="ml-1">
                    {signatureData.type}
                  </Badge>
                  {signatureData.updatedAt && (
                    <span className="ml-2 text-muted-foreground">
                      Last updated: {new Date(signatureData.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Ready for use</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!signatureData.enabled && signatureData.updatedAt && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Digital signature is disabled</strong>
            <div className="text-sm mt-1">
              You have a signature on file but it's currently disabled. Enable it below to use for approvals.
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-600" />
            Digital Signature
            {signatureData.enabled && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Set up your digital signature for document approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
            <div>
              <Label htmlFor="has-signature" className="text-sm font-medium">
                Enable Digital Signature
              </Label>
              <p className="text-sm text-slate-600">Use digital signature for approvals</p>
              {signatureData.cloudinaryId && (
                <p className="text-xs text-muted-foreground mt-1">Signature ID: {signatureData.cloudinaryId}</p>
              )}
            </div>
            <Switch
              id="has-signature"
              checked={signatureData.hasSignature}
              onCheckedChange={(checked) => setSignatureData((prev) => ({ ...prev, hasSignature: checked }))}
            />
          </div>

          {signatureData.hasSignature && (
            <>
              <Tabs value={signatureMethod} onValueChange={(value) => setSignatureMethod(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="draw" className="flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    Draw
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Draw Your Signature</Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 bg-white">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="w-full h-[200px] cursor-crosshair touch-none border rounded"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-muted-foreground">Draw your signature in the box above</p>
                      <Button variant="outline" size="sm" onClick={clearCanvas}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload Signature Image</Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                        id="signature-upload"
                      />
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                      <Button variant="outline" asChild>
                        <label htmlFor="signature-upload" className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Signature
                        </label>
                      </Button>
                      <p className="text-sm text-slate-500 mt-2">
                        Upload a clear image of your signature (PNG, JPG, max 5MB)
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signature-text">Signature Text</Label>
                    <Input
                      id="signature-text"
                      placeholder="Enter your signature text"
                      value={signatureData.signatureText}
                      onChange={(e) => setSignatureData((prev) => ({ ...prev, signatureText: e.target.value }))}
                      className="text-lg"
                    />
                    <p className="text-sm text-muted-foreground">This text will be used as your digital signature</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2 mt-6">
                <Label>Signature Preview</Label>
                <div className="p-6 border-2 border-slate-300 rounded-lg text-center bg-white min-h-[100px] flex items-center justify-center">
                  {signatureMethod === "text" ? (
                    <div className="text-2xl font-script text-slate-600" style={{ fontFamily: "cursive" }}>
                      {signatureData.signatureText || "Your signature will appear here"}
                    </div>
                  ) : signatureData.signatureUrl ? (
                    <img
                      src={signatureData.signatureUrl || "/placeholder.svg"}
                      alt="Signature"
                      className="max-h-24 mx-auto"
                    />
                  ) : (
                    <p className="text-muted-foreground">Your signature will appear here</p>
                  )}
                </div>
              </div>

              {/* Current Signature Info */}
              {signatureData.enabled && signatureData.updatedAt && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <Label className="text-sm font-medium">Current Signature Information</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="ml-2">
                        {signatureData.type}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={signatureData.enabled ? "default" : "secondary"} className="ml-2">
                        {signatureData.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="ml-2">{new Date(signatureData.updatedAt).toLocaleString()}</span>
                    </div>
                    {signatureData.cloudinaryId && (
                      <div>
                        <span className="text-muted-foreground">Storage ID:</span>
                        <span className="ml-2 font-mono text-xs">{signatureData.cloudinaryId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={downloadSignature}
                  disabled={!signatureData.signatureUrl && signatureMethod !== "text"}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Signature
                </Button>
                <Button
                  onClick={handleSignatureSave}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={saving || (!signatureData.signatureUrl && !signatureData.signatureText)}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
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
  )
}
