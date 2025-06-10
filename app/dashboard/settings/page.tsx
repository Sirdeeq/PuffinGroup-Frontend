"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { User, Bell, PenTool, Upload, Save, Eye, EyeOff, Shield } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [userRole, setUserRole] = useState("")
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@company.com",
    phone: "+1 (555) 123-4567",
    department: "Finance",
    position: "Senior Analyst",
    bio: "Experienced financial analyst with 5+ years in corporate finance.",
    avatar: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    fileUpdates: true,
    requestUpdates: true,
    systemUpdates: false,
    weeklyReports: true,
    monthlyReports: true,
  })

  const [signatureData, setSignatureData] = useState({
    hasSignature: false,
    signatureUrl: "",
    signatureText: "John Doe",
  })

  const [appSettings, setAppSettings] = useState({
    theme: "light",
    language: "en",
    timezone: "UTC-5",
    dateFormat: "MM/DD/YYYY",
    defaultView: "grid",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showPasswords: false,
  })

  useEffect(() => {
    const role = localStorage.getItem("userRole") || ""
    setUserRole(role)

    // Load saved settings
    const savedProfile = localStorage.getItem("profileData")
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile))
    }

    const savedNotifications = localStorage.getItem("notificationSettings")
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications))
    }

    const savedSignature = localStorage.getItem("signatureData")
    if (savedSignature) {
      setSignatureData(JSON.parse(savedSignature))
    }
  }, [])

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

  const handleProfileSave = () => {
    localStorage.setItem("profileData", JSON.stringify(profileData))
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully",
    })
  }

  const handleNotificationSave = () => {
    localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings))
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved",
    })
  }

  const handleSignatureSave = () => {
    localStorage.setItem("signatureData", JSON.stringify(signatureData))
    toast({
      title: "Signature updated",
      description: "Your digital signature has been saved",
    })
  }

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation don't match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    // Simulate password change
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully",
    })

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      showPasswords: false,
    })
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData((prev) => ({
          ...prev,
          avatar: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const themeColor = getThemeColor()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account and application preferences</p>
        </div>
        <Badge variant="outline" className={`text-${themeColor}-600 border-${themeColor}-200`}>
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Account
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="signature">
            <PenTool className="w-4 h-4 mr-2" />
            Signature
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatar || "/placeholder.svg"} alt="Profile" />
                  <AvatarFallback className={`bg-${themeColor}-100 text-${themeColor}-700 text-xl`}>
                    {profileData.firstName.charAt(0)}
                    {profileData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium text-slate-800">Profile Picture</h3>
                  <p className="text-sm text-slate-600 mb-3">Upload a new profile picture</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </label>
                  </Button>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={profileData.position}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, position: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave} className={`bg-${themeColor}-500 hover:bg-${themeColor}-600`}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>Customize your application experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={appSettings.theme}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, theme: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={appSettings.language}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, language: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={appSettings.timezone}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, timezone: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                    <option value="UTC-6">Central Time (UTC-6)</option>
                    <option value="UTC-7">Mountain Time (UTC-7)</option>
                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    value={appSettings.dateFormat}
                    onChange={(e) => setAppSettings((prev) => ({ ...prev, dateFormat: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Methods */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-800">Notification Methods</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-slate-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-slate-600">Receive browser push notifications</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-slate-600">Receive notifications via text message</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, smsNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-800">Notification Types</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="file-updates">File Updates</Label>
                      <p className="text-sm text-slate-600">Notifications about file status changes</p>
                    </div>
                    <Switch
                      id="file-updates"
                      checked={notificationSettings.fileUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, fileUpdates: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="request-updates">Request Updates</Label>
                      <p className="text-sm text-slate-600">Notifications about request approvals</p>
                    </div>
                    <Switch
                      id="request-updates"
                      checked={notificationSettings.requestUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, requestUpdates: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="system-updates">System Updates</Label>
                      <p className="text-sm text-slate-600">Notifications about system maintenance</p>
                    </div>
                    <Switch
                      id="system-updates"
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, systemUpdates: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="weekly-reports">Weekly Reports</Label>
                      <p className="text-sm text-slate-600">Receive weekly activity summaries</p>
                    </div>
                    <Switch
                      id="weekly-reports"
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, weeklyReports: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="monthly-reports">Monthly Reports</Label>
                      <p className="text-sm text-slate-600">Receive monthly performance reports</p>
                    </div>
                    <Switch
                      id="monthly-reports"
                      checked={notificationSettings.monthlyReports}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, monthlyReports: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationSave} className={`bg-${themeColor}-500 hover:bg-${themeColor}-600`}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Digital Signature */}
        <TabsContent value="signature" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Digital Signature</CardTitle>
              <CardDescription>Set up your digital signature for document approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="signature-text">Signature Text</Label>
                      <Input
                        id="signature-text"
                        placeholder="Enter your signature text"
                        value={signatureData.signatureText}
                        onChange={(e) => setSignatureData((prev) => ({ ...prev, signatureText: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Signature Preview</Label>
                      <div className="p-6 border-2 border-dashed border-slate-300 rounded-lg text-center">
                        {signatureData.signatureUrl ? (
                          <img
                            src={signatureData.signatureUrl || "/placeholder.svg"}
                            alt="Signature"
                            className="max-h-24 mx-auto"
                          />
                        ) : (
                          <div className="text-2xl font-script text-slate-600" style={{ fontFamily: "cursive" }}>
                            {signatureData.signatureText || "Your signature will appear here"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Upload Signature Image</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              setSignatureData((prev) => ({
                                ...prev,
                                signatureUrl: event.target?.result as string,
                              }))
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        id="signature-upload"
                      />
                      <Button variant="outline" asChild>
                        <label htmlFor="signature-upload" className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Signature
                        </label>
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSignatureSave} className={`bg-${themeColor}-500 hover:bg-${themeColor}-600`}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Signature
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={passwordData.showPasswords ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setPasswordData((prev) => ({ ...prev, showPasswords: !prev.showPasswords }))}
                    >
                      {passwordData.showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type={passwordData.showPasswords ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type={passwordData.showPasswords ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Password Requirements</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordChange}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className={`bg-${themeColor}-500 hover:bg-${themeColor}-600`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-600">Secure your account with 2FA</p>
                </div>
                <Button variant="outline">Setup 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
