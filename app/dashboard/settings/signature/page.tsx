"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Upload, Save, Download, RefreshCw } from "lucide-react"

export default function SignatureSettingsPage() {
  const { toast } = useToast()
  const [userRole, setUserRole] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "upload" | "text">("draw")
  const [signatureData, setSignatureData] = useState({
    hasSignature: false,
    signatureUrl: "",
    signatureText: "John Doe",
  })

  useEffect(() => {
    const role = localStorage.getItem("userRole") || ""
    setUserRole(role)

    // Load saved signature
    const savedSignature = localStorage.getItem("signatureData")
    if (savedSignature) {
      setSignatureData(JSON.parse(savedSignature))
    }

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
  }, [signatureMethod])

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

  const handleSignatureSave = () => {
    localStorage.setItem("signatureData", JSON.stringify(signatureData))
    toast({
      title: "Signature updated",
      description: "Your digital signature has been saved successfully",
    })
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

      <Card>
        <CardHeader>
          <CardTitle>Digital Signature</CardTitle>
          <CardDescription>Set up your digital signature for document approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="has-signature">Enable Digital Signature</Label>
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
                  <TabsTrigger value="draw">Draw Signature</TabsTrigger>
                  <TabsTrigger value="upload">Upload Image</TabsTrigger>
                  <TabsTrigger value="text">Text Signature</TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Draw Your Signature</Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 bg-white">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="w-full h-[200px] cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-2">
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
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                        id="signature-upload"
                      />
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
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2 mt-6">
                <Label>Signature Preview</Label>
                <div className="p-6 border-2 border-slate-300 rounded-lg text-center bg-white">
                  {signatureMethod === "text" ? (
                    <div className="text-2xl font-script text-slate-600" style={{ fontFamily: "cursive" }}>
                      {signatureData.signatureText || "Your signature will appear here"}
                    </div>
                  ) : (
                    signatureData.signatureUrl && (
                      <img
                        src={signatureData.signatureUrl || "/placeholder.svg"}
                        alt="Signature"
                        className="max-h-24 mx-auto"
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={downloadSignature} disabled={!signatureData.signatureUrl}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Signature
                </Button>
                <Button onClick={handleSignatureSave} className={`bg-${themeColor}-500 hover:bg-${themeColor}-600`}>
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
