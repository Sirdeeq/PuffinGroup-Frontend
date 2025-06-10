"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Settings, Save, Upload, Palette, Shield, Users, Mail, FileText, MessageSquare, Building2 } from "lucide-react"

export default function AppSettingsPage() {
  const { toast } = useToast()
  const [userRole, setUserRole] = useState("")
  const [appSettings, setAppSettings] = useState({
    // Branding
    companyName: "Enterprise Corp",
    logoUrl: "",
    primaryColor: "#FF6B00", // Orange
    secondaryColor: "#0066FF", // Blue
    accentColor: "#00CC88", // Green

    // Permissions
    defaultUserRole: "department",
    fileCreationPermission: "all",
    requestCreationPermission: "all",
    reportAccessPermission: "admin_director",
    userManagementPermission: "admin",

    // Email Settings
    emailSender: "noreply@enterprise.com",
    emailFooter: "© 2024 Enterprise Corp. All rights reserved.",
    emailSignature: true,

    // System Settings
    maintenanceMode: false,
    debugMode: false,
    maxFileSize: 10, // MB
    allowedFileTypes: "pdf,doc,docx,xls,xlsx,jpg,png",
    sessionTimeout: 30, // minutes
  })

  useEffect(() => {
    const role = localStorage.getItem("userRole") || ""
    setUserRole(role)

    // Only allow admin to access this page
    if (role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access application settings",
        variant: "destructive",
      })
      // Redirect to dashboard
      window.location.href = "/dashboard"
    }

    // Load saved app settings
    const savedSettings = localStorage.getItem("appSettings")
    if (savedSettings) {
      setAppSettings(JSON.parse(savedSettings))
    }
  }, [toast])

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAppSettings((prev) => ({
          ...prev,
          logoUrl: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSettingsSave = () => {
    localStorage.setItem("appSettings", JSON.stringify(appSettings))
    toast({
      title: "Settings updated",
      description: "Application settings have been saved successfully",
    })
  }

  const permissionOptions = [
    { value: "all", label: "All Users" },
    { value: "admin_director", label: "Admins & Directors" },
    { value: "admin", label: "Admins Only" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Application Settings</h1>
        <p className="text-slate-600 mt-1">Configure system-wide settings and defaults</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">
            <Palette className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email Settings
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Branding</CardTitle>
              <CardDescription>Customize the appearance of your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={appSettings.companyName}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center space-x-4">
                    {appSettings.logoUrl && (
                      <div className="w-16 h-16 border rounded-md overflow-hidden">
                        <img
                          src={appSettings.logoUrl || "/placeholder.svg"}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={appSettings.primaryColor}
                      onChange={(e) => setAppSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={appSettings.primaryColor}
                      onChange={(e) => setAppSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={appSettings.secondaryColor}
                      onChange={(e) => setAppSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={appSettings.secondaryColor}
                      onChange={(e) => setAppSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={appSettings.accentColor}
                      onChange={(e) => setAppSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={appSettings.accentColor}
                      onChange={(e) => setAppSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Color Preview</h4>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-md" style={{ backgroundColor: appSettings.primaryColor }} />
                  <div className="w-16 h-16 rounded-md" style={{ backgroundColor: appSettings.secondaryColor }} />
                  <div className="w-16 h-16 rounded-md" style={{ backgroundColor: appSettings.accentColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Settings */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Permissions</CardTitle>
              <CardDescription>Configure default permissions for users and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <Label htmlFor="default-role">Default User Role</Label>
                      <p className="text-sm text-slate-600">Role assigned to new users by default</p>
                    </div>
                  </div>
                  <Select
                    value={appSettings.defaultUserRole}
                    onValueChange={(value) => setAppSettings((prev) => ({ ...prev, defaultUserRole: value }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="department">Department User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <Label htmlFor="file-creation">File Creation</Label>
                      <p className="text-sm text-slate-600">Who can create new files</p>
                    </div>
                  </div>
                  <Select
                    value={appSettings.fileCreationPermission}
                    onValueChange={(value) => setAppSettings((prev) => ({ ...prev, fileCreationPermission: value }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <Label htmlFor="request-creation">Request Creation</Label>
                      <p className="text-sm text-slate-600">Who can create new requests</p>
                    </div>
                  </div>
                  <Select
                    value={appSettings.requestCreationPermission}
                    onValueChange={(value) => setAppSettings((prev) => ({ ...prev, requestCreationPermission: value }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <Label htmlFor="department-management">Department Management</Label>
                      <p className="text-sm text-slate-600">Who can manage departments</p>
                    </div>
                  </div>
                  <Select
                    value={appSettings.userManagementPermission}
                    onValueChange={(value) => setAppSettings((prev) => ({ ...prev, userManagementPermission: value }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure email settings for notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email-sender">Sender Email Address</Label>
                  <Input
                    id="email-sender"
                    type="email"
                    value={appSettings.emailSender}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, emailSender: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="email-signature">Include Company Signature</Label>
                    <p className="text-sm text-slate-600">Add company signature to all emails</p>
                  </div>
                  <Switch
                    id="email-signature"
                    checked={appSettings.emailSignature}
                    onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, emailSignature: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-footer">Email Footer Text</Label>
                <Input
                  id="email-footer"
                  value={appSettings.emailFooter}
                  onChange={(e) => setAppSettings((prev) => ({ ...prev, emailFooter: e.target.value }))}
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Email Preview</h4>
                <div className="border rounded-md p-4 bg-white">
                  <div className="text-sm text-slate-800 space-y-4">
                    <p>Subject: [Enterprise App] Notification</p>
                    <p>From: {appSettings.emailSender}</p>
                    <hr />
                    <p>Hello User,</p>
                    <p>This is a sample notification from the Enterprise App.</p>
                    <p>
                      Best regards,
                      <br />
                      Enterprise Team
                    </p>
                    {appSettings.emailSignature && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          {appSettings.logoUrl && (
                            <img src={appSettings.logoUrl || "/placeholder.svg"} alt="Logo" className="h-6" />
                          )}
                          <span className="font-medium">{appSettings.companyName}</span>
                        </div>
                      </div>
                    )}
                    <div className="pt-4 text-xs text-slate-500">{appSettings.emailFooter}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure technical settings for the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    min="1"
                    max="100"
                    value={appSettings.maxFileSize}
                    onChange={(e) =>
                      setAppSettings((prev) => ({ ...prev, maxFileSize: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="5"
                    max="120"
                    value={appSettings.sessionTimeout}
                    onChange={(e) =>
                      setAppSettings((prev) => ({ ...prev, sessionTimeout: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowed-file-types">Allowed File Types</Label>
                <Input
                  id="allowed-file-types"
                  placeholder="Comma-separated file extensions (e.g., pdf,doc,jpg)"
                  value={appSettings.allowedFileTypes}
                  onChange={(e) => setAppSettings((prev) => ({ ...prev, allowedFileTypes: e.target.value }))}
                />
                <p className="text-xs text-slate-500">
                  Enter file extensions separated by commas, without dots or spaces
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="maintenance-mode" className="text-red-600 font-medium">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-slate-600">
                      Enable to block access to the application during maintenance
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={appSettings.maintenanceMode}
                    onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                    <p className="text-sm text-slate-600">Enable detailed error messages and logging</p>
                  </div>
                  <Switch
                    id="debug-mode"
                    checked={appSettings.debugMode}
                    onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, debugMode: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSettingsSave} className="bg-orange-500 hover:bg-orange-600">
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
