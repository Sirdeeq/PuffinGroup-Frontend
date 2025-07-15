"use client"

import { formatDistanceToNow } from "date-fns"
import { FileText, Folder, Share, User, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NotificationProps {
  notification: {
    _id: string
    message: string
    file?: {
      _id: string
      name: string
    }
    folder?: {
      _id: string
      name: string
    }
    actionType: string
    createdBy: {
      _id: string
      firstName: string
      lastName: string
    }
    createdAt: string
  }
}

export function Notification({ notification }: NotificationProps) {
  const getIcon = () => {
    switch (notification.actionType) {
      case "file_created":
      case "file_updated":
      case "file_deleted":
        return <FileText className="w-4 h-4 text-blue-500" />
      case "folder_created":
      case "folder_updated":
      case "folder_deleted":
        return <Folder className="w-4 h-4 text-green-500" />
      case "file_shared":
        return <Share className="w-4 h-4 text-purple-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getBadgeVariant = () => {
    switch (notification.actionType) {
      case "file_created":
      case "folder_created":
        return "default"
      case "file_updated":
      case "folder_updated":
        return "secondary"
      case "file_deleted":
      case "folder_deleted":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getBadgeText = () => {
    switch (notification.actionType) {
      case "file_created":
        return "New File"
      case "file_updated":
        return "File Updated"
      case "file_deleted":
        return "File Deleted"
      case "folder_created":
        return "New Folder"
      case "folder_updated":
        return "Folder Updated"
      case "folder_deleted":
        return "Folder Deleted"
      case "file_shared":
        return "Shared"
      default:
        return "Notification"
    }
  }

  return (
    <div className="flex items-start gap-3 w-full">
      <div className="flex-shrink-0 mt-1">
        <div className="p-2 rounded-full bg-gray-100">
          {getIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant={getBadgeVariant()} className="text-xs">
            {getBadgeText()}
          </Badge>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-900 mt-1">
          {notification.message}
        </p>
        {notification.file && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <FileText className="w-3 h-3" />
            <span>{notification.file.name}</span>
          </div>
        )}
        {notification.folder && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Folder className="w-3 h-3" />
            <span>{notification.folder.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <User className="w-3 h-3" />
          <span>
            {notification.createdBy.firstName} {notification.createdBy.lastName}
          </span>
        </div>
      </div>
    </div>
  )
}