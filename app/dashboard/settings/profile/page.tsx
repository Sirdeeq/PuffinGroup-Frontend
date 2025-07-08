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
import {
  Upload,
  Save,
  Loader2,
  CheckCircle,
  Settings,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Crown,
  Shield,
  Star,
  Zap,
  Camera,
  Edit3,
} from "lucide-react"
import { api } from "@/utils/api"
import { useAuth } from "@/contexts/AuthContext"

export default function ProfileSettingsPage() {
  const { toast } = useToast()
  const authContext = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
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
          const userData = response.data.user
          setProfileData({
            ...userData,
            phone: userData.phone || "",
            bio: userData.bio || "",
            signature: userData.signature || {
              enabled: false,
              type: "text",
              data: "",
              updatedAt: "",
            },
          })
          // Set avatar preview if exists
          if (userData.avatar) {
            setAvatarPreview(userData.avatar)
          }
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

  const getThemeColors = () => {
    switch (profileData.role) {
      case "admin":
        return {
          primary: "from-orange-500 to-amber-500",
          secondary: "from-orange-50 to-amber-50",
          accent: "orange-500",
          text: "orange-700",
          border: "orange-200",
          bg: "orange-50",
          icon: Crown,
        }
      case "director":
        return {
          primary: "from-red-500 to-rose-500",
          secondary: "from-red-50 to-rose-50",
          accent: "red-500",
          text: "red-700",
          border: "red-200",
          bg: "red-50",
          icon: Shield,
        }
      case "department":
        return {
          primary: "from-green-500 to-emerald-500",
          secondary: "from-green-50 to-emerald-50",
          accent: "green-500",
          text: "green-700",
          border: "green-200",
          bg: "green-50",
          icon: Star,
        }
      default:
        return {
          primary: "from-blue-500 to-indigo-500",
          secondary: "from-blue-50 to-indigo-50",
          accent: "blue-500",
          text: "blue-700",
          border: "blue-200",
          bg: "blue-50",
          icon: Zap,
        }
    }
  }

  const handleProfileSave = async () => {
    try {
      setSaving(true)

      if (!authContext.user?._id) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        })
        return
      }

      // First update profile data
      const profileResponse = await api.updateUser(
        authContext.user._id,
        {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          position: profileData.position,
          bio: profileData.bio,
        },
        authContext,
      )

      // Then handle avatar upload if there's a new file
      if (avatarFile) {
        const formData = new FormData()
        formData.append("avatar", avatarFile)

        const avatarResponse = await api.updateUseravatar(authContext.user._id, formData, authContext)

        if (avatarResponse.success) {
          // Update the avatar in profile data
          setProfileData((prev) => ({
            ...prev,
            avatar: avatarResponse.data?.user?.avatar || avatarPreview,
          }))
        }
      }

      if (profileResponse.success) {
        // Update the user data in the auth context
        await authContext.getUser()
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved successfully",
        })
        // Clear the avatar file after successful upload
        setAvatarFile(null)
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

      // Store the file for later upload
      setAvatarFile(file)

      // Create a preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAvatarPreview(result)
        setProfileData((prev) => ({
          ...prev,
          avatar: result,
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
        return "Managing Director"
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

  const themeColors = getThemeColors()
  const RoleIcon = themeColors.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Loading profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Enhanced Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-slate-600 text-lg">Manage your personal information and preferences</p>
      </div>

      {/* Enhanced Profile Summary Card */}
      <Card
        className={`border-0 shadow-xl bg-gradient-to-br ${themeColors.primary} text-white overflow-hidden relative`}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-white/30 shadow-2xl">
                <AvatarImage
                  src={avatarPreview || profileData.avatar || "/placeholder.svg?height=128&width=128"}
                  alt="Profile"
                />
                <AvatarFallback className="bg-white/20 text-white text-3xl font-bold backdrop-blur-sm">
                  {profileData.firstName?.charAt(0)}
                  {profileData.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <RoleIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-white/80 text-lg">{profileData.email}</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2"
                  >
                    <RoleIcon className="w-4 h-4 mr-2" />
                    {getRoleTitle(profileData.role)}
                  </Badge>

                  {profileData.position && (
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2"
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      {profileData.position === "Department Staff" ? "Department Head" : profileData.position}
                    </Badge>
                  )}

                  {profileData.department && profileData.department.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Department
                    </Badge>
                  )}
                </div>

                {profileData.lastLogin && (
                  <p className="text-white/70 text-sm">Last login: {formatDate(profileData.lastLogin)}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Profile Information Card */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${themeColors.secondary}`}>
              <User className={`w-6 h-6 text-${themeColors.text}`} />
            </div>
            Profile Information
          </CardTitle>
          <CardDescription className="text-base">Update your personal information and preferences</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Enhanced Avatar Section */}
          <div className="flex items-center space-x-8 p-6 bg-slate-50 rounded-2xl">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage
                  src={avatarPreview || profileData.avatar || "/placeholder.svg?height=96&width=96"}
                  alt="Profile"
                />
                <AvatarFallback className={`bg-gradient-to-br ${themeColors.primary} text-white text-xl font-semibold`}>
                  {profileData.firstName?.charAt(0)}
                  {profileData.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Profile Picture</h3>
              <p className="text-slate-600 mb-4">Upload a new profile picture (max 5MB)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                className="hover:shadow-md transition-all duration-200 bg-transparent"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {avatarFile ? "Change Photo" : "Upload Photo"}
              </Button>
              {avatarFile && (
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  New photo ready to save
                </p>
              )}
            </div>
          </div>

          {/* Enhanced Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="firstName" className="flex items-center gap-2 text-base font-medium">
                <User className="w-4 h-4 text-slate-600" />
                First Name
              </Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="lastName" className="flex items-center gap-2 text-base font-medium">
                <User className="w-4 h-4 text-slate-600" />
                Last Name
              </Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="flex items-center gap-2 text-base font-medium">
                <Mail className="w-4 h-4 text-slate-600" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled={true}
                className="bg-slate-100 h-12 text-base"
              />
              <p className="text-sm text-slate-500">Email address cannot be changed</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="flex items-center gap-2 text-base font-medium">
                <Phone className="w-4 h-4 text-slate-600" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-12 text-base"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="position" className="flex items-center gap-2 text-base font-medium">
                <Briefcase className="w-4 h-4 text-slate-600" />
                Position
              </Label>
              <Input
                id="position"
                value={profileData.position}
                onChange={(e) => setProfileData((prev) => ({ ...prev, position: e.target.value }))}
                className="h-12 text-base"
                placeholder="Enter your position"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="department" className="flex items-center gap-2 text-base font-medium">
                <Building2 className="w-4 h-4 text-slate-600" />
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
                className="bg-slate-100 h-12 text-base"
              />
              <p className="text-sm text-slate-500">Department is assigned by administrators</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="bio" className="flex items-center gap-2 text-base font-medium">
              <Edit3 className="w-4 h-4 text-slate-600" />
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={profileData.bio}
              onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="text-base"
            />
          </div>

          {/* Enhanced Signature Status */}
          {profileData.signature && (
            <div
              className={`p-6 border-2 border-dashed border-${themeColors.border} rounded-2xl bg-gradient-to-br ${themeColors.secondary}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${themeColors.accent} text-white`}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Digital Signature Status</h3>
                </div>
                <Badge
                  variant={profileData.signature.enabled ? "default" : "outline"}
                  className={profileData.signature.enabled ? `bg-${themeColors.accent} text-white` : ""}
                >
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

              <div className="space-y-3">
                {profileData.signature.enabled ? (
                  <>
                    <p className="text-slate-700">You have an active {profileData.signature.type} signature.</p>
                    {profileData.signature.updatedAt && (
                      <p className="text-sm text-slate-600">
                        Last updated: {formatDate(profileData.signature.updatedAt)}
                      </p>
                    )}
                    {profileData.signature.data && (
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm text-slate-600 mb-2">Signature Preview:</p>
                        {profileData.signature.type === "text" ? (
                          <div className="text-2xl font-script text-slate-800" style={{ fontFamily: "cursive" }}>
                            {profileData.signature.data}
                          </div>
                        ) : (
                          <img
                            src={profileData.signature.data || "/placeholder.svg"}
                            alt="Signature"
                            className="max-h-16 border rounded"
                          />
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-700">
                    You don't have an active signature. Set one up in the Signature Settings.
                  </p>
                )}

                <Button variant="outline" size="sm" asChild className="mt-4 bg-transparent">
                  <a href="/dashboard/settings/signature">
                    <Settings className="w-4 h-4 mr-2" />
                    Signature Settings
                  </a>
                </Button>
              </div>
            </div>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              Your profile information is visible only to you and system administrators.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end pt-6 border-t">
            <Button
              onClick={handleProfileSave}
              className={`bg-gradient-to-r ${themeColors.primary} text-white hover:shadow-lg transition-all duration-200 px-8 py-3 text-base`}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
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
