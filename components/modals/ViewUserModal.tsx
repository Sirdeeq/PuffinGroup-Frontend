"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Mail, Phone, Building2, Calendar, User, Shield, UserCheck } from "lucide-react"

interface ViewUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

export function ViewUserModal({ open, onOpenChange, user }: ViewUserModalProps) {
  if (!user) return null

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Shield className="w-3 h-3 mr-1" />
            Administrator
          </Badge>
        )
      case "director":
        return (
          <Badge className="bg-red-100 text-red-800">
            <UserCheck className="w-3 h-3 mr-1" />
            Director
          </Badge>
        )
      case "department":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Building2 className="w-3 h-3 mr-1" />
            Department User
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>View complete user information and account details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/placeholder.svg" alt={user.firstName} />
              <AvatarFallback
                className={
                  user.role === "admin"
                    ? "bg-orange-100 text-orange-700"
                    : user.role === "director"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                }
              >
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-800">
                {user.firstName} {user.lastName}
              </h3>
              <div className="mt-2">{getRoleBadge(user.role)}</div>
            </div>
            <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {user.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-slate-800 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Contact Information
            </h4>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <Label className="text-sm font-medium text-slate-600">Email</Label>
                  <p className="text-slate-800">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Phone</Label>
                    <p className="text-slate-800">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-slate-800 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Work Information
            </h4>

            <div className="grid grid-cols-1 gap-4">
              {user.department && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Department</Label>
                  <p className="text-slate-800">
                    {user.department.name} ({user.department.code})
                  </p>
                </div>
              )}

              {user.position && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Position</Label>
                  <p className="text-slate-800">{user.position}</p>
                </div>
              )}

              {user.bio && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Bio</Label>
                  <p className="text-slate-800">{user.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-slate-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Account Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-600">Created</Label>
                <p className="text-slate-800">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Last Updated</Label>
                <p className="text-slate-800">{new Date(user.updatedAt).toLocaleDateString()}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Last Login</Label>
                <p className="text-slate-800">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Account Status</Label>
                <p className="text-slate-800">{user.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
