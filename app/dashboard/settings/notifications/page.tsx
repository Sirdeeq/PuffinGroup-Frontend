"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Bell, Save, Mail, MessageSquare, Smartphone, Globe, FileText, AlertCircle } from "lucide-react"

export default function NotificationSettingsPage() {
  const { toast } = useToast()
  const [userRole, setUserRole] = useState("")
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    fileUpdates: true,
    requestUpdates: true,
    systemUpdates: false,
    weeklyReports: true,
    monthlyReports: true,
    signatureRequests: true,
    contactEmail: "",
    contactPhone: "",
  })

  useEffect(() => {
    const role = localStorage.getItem("userRole") || ""
    setUserRole(role)

    // Load saved notification settings
    const savedNotifications = localStorage.getItem("notificationSettings")
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications))
    }

    // Load profile data for contact info
    const savedProfile = localStorage.getItem("profileData")
    if (savedProfile) {
      const profile = JSON.parse(savedProfile)
      setNotificationSettings((prev) => ({
        ...prev,
        contactEmail: profile.email || prev.contactEmail,
        contactPhone: profile.phone || prev.contactPhone,
      }))
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

  const handleNotificationSave = () => {
    localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings))
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved",
    })
  }

  const themeColor = getThemeColor()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Notification Settings</h1>
        <p className="text-slate-600 mt-1">Manage how you receive notifications and alerts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Methods</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-slate-600">Receive notifications via email</p>
                </div>
              </div>
              <div className="space-y-2">
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                  }
                />
                {notificationSettings.emailNotifications && (
                  <Input
                    placeholder="Email address"
                    value={notificationSettings.contactEmail}
                    onChange={(e) => setNotificationSettings((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-64"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-slate-600">Receive browser push notifications</p>
                </div>
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
              <div className="flex items-start space-x-3">
                <Smartphone className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-slate-600">Receive notifications via text message</p>
                </div>
              </div>
              <div className="space-y-2">
                <Switch
                  id="sms-notifications"
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({ ...prev, smsNotifications: checked }))
                  }
                />
                {notificationSettings.smsNotifications && (
                  <Input
                    placeholder="Phone number"
                    value={notificationSettings.contactPhone}
                    onChange={(e) => setNotificationSettings((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-64"
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Select which types of notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <Label htmlFor="file-updates">File Updates</Label>
                  <p className="text-sm text-slate-600">Notifications about file status changes</p>
                </div>
              </div>
              <Switch
                id="file-updates"
                checked={notificationSettings.fileUpdates}
                onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, fileUpdates: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <Label htmlFor="request-updates">Request Updates</Label>
                  <p className="text-sm text-slate-600">Notifications about request approvals</p>
                </div>
              </div>
              <Switch
                id="request-updates"
                checked={notificationSettings.requestUpdates}
                onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, requestUpdates: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <Label htmlFor="signature-requests">Signature Requests</Label>
                  <p className="text-sm text-slate-600">Notifications when your signature is requested</p>
                </div>
              </div>
              <Switch
                id="signature-requests"
                checked={notificationSettings.signatureRequests}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, signatureRequests: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start space-x-3">
                <Bell className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <Label htmlFor="system-updates">System Updates</Label>
                  <p className="text-sm text-slate-600">Notifications about system maintenance</p>
                </div>
              </div>
              <Switch
                id="system-updates"
                checked={notificationSettings.systemUpdates}
                onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, systemUpdates: checked }))}
              />
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
    </div>
  )
}
