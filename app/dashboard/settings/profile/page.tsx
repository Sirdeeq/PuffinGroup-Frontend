"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Upload, Save, Loader2, CheckCircle, Settings, User, Mail, Phone, Building2, Briefcase } from "lucide-react"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"

export default function ProfileSettingsPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    bio: "",
    avatar: "",
    role: "",
    department: [] as any[],
    departments: [] as any[],
    lastLogin: "",
    signature: {
      enabled: false,
      type: "text",
      data: "",
      updatedAt: "",
    },
    notifications: {
      types: {
        files: true,
        requests: true,
        system: true,
        reports: false,
      },
      email: true,
      push: true,
      sms: false,
    },
    settings: {
      theme: "light",
      language: "en",
    },
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const response = await api.getUser(authContext)
        if (response.success && response.data?.user) {
          setProfileData({
            ...response.data.user,
            phone: response.data.user.phone || "",
            bio: response.data.user.bio || "",
            signature: response.data.user.signature || {
              enabled: response.data.user.signature.enabled,
              type: response.data.user.signature.type,
              data: response.data.user.signature.data,
              updatedAt: response.data.user.signature.updatedAt,
            },
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (authContext.isAuthenticated) {
      fetchUserData()
    }
  }, [authContext, toast])

  const getThemeColor = () => {
    switch (profileData.role) {
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

  const handleProfileSave = async () => {
    try {
      setSaving(true)

      // First update profile data
      if (!authContext.user?.id) {
        toast({
          title: "Error",
          description: "User ID not found",
        });
        return;
      }

      const profileResponse = await api.updateUser(authContext.user.id, profileData, authContext)

      // Then handle avatar upload if there's a new file
      if (avatarFile) {
        const formData = new FormData()
        formData.append("avatar", avatarFile)

        await api.updateUseravatar(authContext.user?.id, formData, authContext)
      }

      if (profileResponse.success) {
        // Update the user data in the auth context
        await authContext.getUser()
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved successfully",
        })
      }
    } catch (error) {
      console.error("Error updating user data:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Store the file for later upload
      setAvatarFile(file)

      // Create a preview
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

  const getRoleTitle = (role: string) => {
    switch (role) {
      case "department":
        return "Department Head"
      case "director":
        return "Department Director"
      case "admin":
        return "System Administrator"
      default:
        return "User"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  const themeColor = getThemeColor()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-slate-600 mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Profile Summary Card */}
      <Card className={`border-l-4 border-l-${themeColor}-500`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-2 border-white shadow-md">
              <AvatarImage src={profileData.avatar || "/placeholder.svg?height=96&width=96"} alt="Profile" />
              <AvatarFallback className={`bg-${themeColor}-100 text-${themeColor}-700 text-xl`}>
                {profileData.firstName?.charAt(0)}
                {profileData.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-slate-600">{profileData.email}</p>
                </div>
                <Badge variant="outline" className={`text-${themeColor}-600 border-${themeColor}-200 w-fit`}>
                  {getRoleTitle(profileData.role)}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {profileData.position && (
                  <Badge variant="secondary" className="text-xs">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {profileData.position === "Department Staff" ? "Department Head" : profileData.position}
                  </Badge>
                )}

                {profileData.department && profileData.department.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Building2 className="w-3 h-3 mr-1" />
                    Department
                  </Badge>
                )}

                {profileData.lastLogin && (
                  <span className="text-xs text-slate-500 flex items-center">
                    Last login: {formatDate(profileData.lastLogin)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-slate-600" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileData.avatar || "/placeholder.svg?height=96&width=96"} alt="Profile" />
              <AvatarFallback className={`bg-${themeColor}-100 text-${themeColor}-700 text-xl`}>
                {profileData.firstName?.charAt(0)}
                {profileData.lastName?.charAt(0)}
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
                ref={fileInputRef}
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
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                First Name
              </Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Last Name
              </Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                disabled={true}
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">Email address cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Position
              </Label>
              <Input
                id="position"
                value={profileData.position}
                onChange={(e) => setProfileData((prev) => ({ ...prev, position: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Department
              </Label>
              <Input
                id="department"
                value={
                  profileData.department && profileData.department.length > 0
                    ? typeof profileData.department[0] === "string"
                      ? profileData.department[0]
                      : profileData.department[0]?.name || ""
                    : ""
                }
                disabled={true}
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">Department is assigned by administrators</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={profileData.bio}
              onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Signature Status */}
          {profileData.signature && (
            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-medium">Digital Signature Status</h3>
                </div>
                <Badge variant={profileData.signature.enabled ? "default" : "outline"} className="text-xs">
                  {profileData.signature.enabled ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    "Not Set"
                  )}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {profileData.signature.enabled ? (
                  <>

                    <p>
                      You have an active {profileData.signature.type} signature. Last updated:{" "}
                      {formatDate(profileData.signature.updatedAt)}
                    </p>
                    <img src={profileData.signature.data} alt="Signature" />
                  </>
                ) : (
                  <p>You don't have an active signature. Set one up in the Signature Settings.</p>
                )}
              </div>
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard/settings/signature">
                    <Settings className="w-3 h-3 mr-1" />
                    Signature Settings
                  </a>
                </Button>
              </div>
            </div>
          )}

          <Alert className="bg-slate-50 border-slate-200">
            <AlertDescription className="text-slate-700">
              Your profile information is not visible to other users in your organization.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={handleProfileSave} className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
