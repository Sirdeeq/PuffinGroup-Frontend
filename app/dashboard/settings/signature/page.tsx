"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

interface SignatureData {
  enabled: boolean;
  type: "draw" | "upload" | "text";
  data: string;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Upload, Save, Download, RefreshCw, PenTool, Type, ImageIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/utils/api"

export default function SignatureSettingsPage() {
  const { toast } = useToast()
  const [userRole, setUserRole] = useState("")
  const [user, setUser] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "upload" | "text">("draw")
  const [signatureData, setSignatureData] = useState({
    hasSignature: false,
    signatureUrl: "",
    signatureText: "",
  })
  const { user: authUser, isAuthenticated } = useAuth()

  useEffect(() => {
    const role = localStorage.getItem("userRole") || ""
    setUserRole(role)

    // Load user signature status from API
    const loadSignatureStatus = async () => {
      try {
        const signatureResponse = await api.getUserSignature(authContext)
        if (signatureResponse.success && signatureResponse.data) {
          const signature = signatureResponse.data as SignatureData
          setSignatureData({
            hasSignature: signature.enabled,
            signatureUrl: signature.type === 'draw' ? signature.data : '',
            signatureText: signature.type === 'text' ? signature.data : ''
          })
          setSignatureMethod(signature.type as "draw" | "upload" | "text")
        }
      } catch (error) {
        console.error("Error loading signature status:", error)
        toast({
          title: "Error",
          description: "Failed to load signature status. Please try again.",
          variant: "destructive"
        })
      }
    }

    // Load user data
    api.getUser(authContext).then((response: { success: boolean; data?: User }) => {
      if (response.success && response.data) {
        setUser(response.data)
        // Set default signature text to user's full name if no signature exists
        if (!signatureData.signatureText) {
          setSignatureData(prev => ({
            ...prev,
            signatureText: `${response.data.firstName || ''} ${response.data.lastName || ''}`
          }))
        }
      }
    })

    loadSignatureStatus()

    // Initialize canvas
    initCanvas()

    // If there's a saved signature URL, draw it on the canvas
    if (signatureData.signatureUrl && signatureMethod === "draw") {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
          }
        }
      }
      img.src = signatureData.signatureUrl
    }
  }, [signatureMethod, authUser])

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

      // Get coordinates based on event type
      let x, y
      if ("touches" in e) {
        // Touch event
        const rect = canvas.getBoundingClientRect()
        x = e.touches[0].clientX - rect.left
        y = e.touches[0].clientY - rect.top
      } else {
        // Mouse event
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
      // Get coordinates based on event type
      let x, y
      if ("touches" in e) {
        // Touch event
        const rect = canvas.getBoundingClientRect()
        x = e.touches[0].clientX - rect.left
        y = e.touches[0].clientY - rect.top
      } else {
        // Mouse event
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
    }
  }

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSignatureData((prev) => ({
          ...prev,
          signatureUrl: e.target?.result as string,
          hasSignature: true,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const authContext = useAuth()

  const handleSignatureSave = async () => {
    try {
      // Save to localStorage first
      localStorage.setItem("signatureData", JSON.stringify(signatureData))

      let payload;

      if (signatureMethod === "draw") {
        const canvas = canvasRef.current
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png')
          payload = {
            enabled: signatureData.hasSignature,
            type: 'draw',
            data: dataUrl
          }
        }
      } else if (signatureMethod === "upload" && signatureData.signatureUrl) {
        // For uploaded signatures, use FormData with file
        const formData = new FormData()
        formData.append('enabled', signatureData.hasSignature.toString())
        formData.append('type', 'upload')
        formData.append('data', signatureData.signatureUrl)

        payload = formData
      } else if (signatureMethod === "text" && signatureData.signatureText) {
        // For text signatures, send as JSON
        payload = {
          enabled: signatureData.hasSignature,
          type: 'text',
          data: signatureData.signatureText
        }
      } else {
        throw new Error('No valid signature data found')
      }

      // Send to API
      const response = await api.updateUserSignature(payload, authContext)
      if (response.success) {
        toast({
          title: "Signature updated",
          description: "Your digital signature has been saved successfully",
        })
      } else {
        throw new Error(response.message || 'Failed to save signature')
      }
    } catch (error) {
      console.error("Error saving signature:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save signature. Please try again.",
        variant: "destructive"
      })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">E-Signature Settings</h1>
        <p className="text-slate-600 mt-1">Create and manage your digital signature for document approvals</p>
      </div>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-600" />
            Digital Signature
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
            </div>
            <Switch
              id="has-signature"
              checked={signatureData.hasSignature}
              onCheckedChange={(checked) => setSignatureData((prev) => ({ ...prev, hasSignature: checked }))}
            />
          </div>

          {signatureData.hasSignature && (
            <>
              <Tabs defaultValue="draw" onValueChange={(value) => setSignatureMethod(value as any)}>
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
                      <p className="text-sm text-slate-500 mt-2">Upload a clear image of your signature (PNG, JPG)</p>
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

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={downloadSignature} disabled={!signatureData.signatureUrl}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Signature
                </Button>
                <Button onClick={handleSignatureSave} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Signature
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
