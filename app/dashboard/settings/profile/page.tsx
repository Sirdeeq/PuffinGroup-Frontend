"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Upload, Save } from "lucide-react"

export default function ProfileSettingsPage() {
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

  useEffect(() => {
    const role = localStorage.getItem("userRole") || ""
    setUserRole(role)

    // Load saved profile
    const savedProfile = localStorage.getItem("profileData")
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile))
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
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-slate-600 mt-1">Manage your personal information and preferences</p>
      </div>

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
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
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
    </div>
  )
}
