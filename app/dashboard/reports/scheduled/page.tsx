"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Clock,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export default function ScheduledReportsPage() {
  const [scheduledReports, setScheduledReports] = useState([
    {
      id: 1,
      name: "Weekly Department Summary",
      template: "Monthly Department Summary",
      frequency: "weekly",
      nextRun: "2024-01-29",
      lastRun: "2024-01-22",
      status: "active",
      recipients: ["admin@company.com", "director@company.com"],
      format: "pdf",
      time: "09:00",
    },
    {
      id: 2,
      name: "Monthly Performance Report",
      template: "User Activity Analysis",
      frequency: "monthly",
      nextRun: "2024-02-01",
      lastRun: "2024-01-01",
      status: "active",
      recipients: ["ceo@company.com"],
      format: "excel",
      time: "08:00",
    },
    {
      id: 3,
      name: "Daily File Status",
      template: "Weekly File Status Report",
      frequency: "daily",
      nextRun: "2024-01-26",
      lastRun: "2024-01-25",
      status: "paused",
      recipients: ["operations@company.com"],
      format: "pdf",
      time: "18:00",
    },
  ])

  const [isCreating, setIsCreating] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    template: "",
    frequency: "weekly",
    time: "09:00",
    recipients: "",
    format: "pdf",
    enabled: true,
  })

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
  ]

  const templates = [
    "Monthly Department Summary",
    "Weekly File Status Report",
    "User Activity Analysis",
    "Performance Metrics Report",
  ]

  const toggleStatus = (id: number) => {
    setScheduledReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, status: report.status === "active" ? "paused" : "active" } : report,
      ),
    )
  }

  const deleteSchedule = (id: number) => {
    setScheduledReports((prev) => prev.filter((report) => report.id !== id))
  }

  const createSchedule = () => {
    const schedule = {
      id: scheduledReports.length + 1,
      ...newSchedule,
      nextRun: getNextRunDate(newSchedule.frequency),
      lastRun: "Never",
      status: newSchedule.enabled ? "active" : "paused",
      recipients: newSchedule.recipients.split(",").map((email) => email.trim()),
    }
    setScheduledReports((prev) => [...prev, schedule])
    setNewSchedule({
      name: "",
      template: "",
      frequency: "weekly",
      time: "09:00",
      recipients: "",
      format: "pdf",
      enabled: true,
    })
    setIsCreating(false)
  }

  const getNextRunDate = (frequency: string) => {
    const now = new Date()
    switch (frequency) {
      case "daily":
        now.setDate(now.getDate() + 1)
        break
      case "weekly":
        now.setDate(now.getDate() + 7)
        break
      case "monthly":
        now.setMonth(now.getMonth() + 1)
        break
      case "quarterly":
        now.setMonth(now.getMonth() + 3)
        break
    }
    return now.toISOString().split("T")[0]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-orange-100 text-orange-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "bg-red-100 text-red-800"
      case "weekly":
        return "bg-orange-100 text-orange-800"
      case "monthly":
        return "bg-blue-100 text-blue-800"
      case "quarterly":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Scheduled Reports</h1>
          <p className="text-slate-600 mt-1">Automate report generation and delivery</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Report</CardTitle>
            <CardDescription>Set up automatic report generation and delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  placeholder="Enter schedule name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-template">Report Template</Label>
                <Select
                  value={newSchedule.template}
                  onValueChange={(value) => setNewSchedule((prev) => ({ ...prev, template: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template} value={template}>
                        {template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="schedule-frequency">Frequency</Label>
                <Select
                  value={newSchedule.frequency}
                  onValueChange={(value) => setNewSchedule((prev) => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule((prev) => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-format">Format</Label>
                <Select
                  value={newSchedule.format}
                  onValueChange={(value) => setNewSchedule((prev) => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-recipients">Email Recipients</Label>
              <Input
                id="schedule-recipients"
                placeholder="Enter email addresses separated by commas"
                value={newSchedule.recipients}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, recipients: e.target.value }))}
              />
              <p className="text-sm text-slate-500">Separate multiple email addresses with commas</p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="schedule-enabled">Enable Schedule</Label>
                <p className="text-sm text-slate-600">Start generating reports immediately</p>
              </div>
              <Switch
                id="schedule-enabled"
                checked={newSchedule.enabled}
                onCheckedChange={(checked) => setNewSchedule((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createSchedule} className="bg-orange-500 hover:bg-orange-600">
                Create Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        {scheduledReports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-orange-100">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{report.name}</h3>
                    <p className="text-slate-600">Template: {report.template}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge className={getFrequencyColor(report.frequency)}>
                        {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status === "active" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {report.format.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStatus(report.id)}
                      className={report.status === "active" ? "text-orange-600" : "text-green-600"}
                    >
                      {report.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSchedule(report.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Run Now
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Schedule Details</p>
                  <p className="text-sm text-slate-800">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Every {report.frequency} at {report.time}
                  </p>
                  <p className="text-sm text-slate-600">Next run: {report.nextRun}</p>
                  <p className="text-sm text-slate-600">Last run: {report.lastRun}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Recipients</p>
                  <div className="space-y-1">
                    {report.recipients.map((email, index) => (
                      <div key={index} className="flex items-center text-sm text-slate-800">
                        <Mail className="w-3 h-3 mr-1" />
                        {email}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Delivery Status</p>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">Last delivery successful</span>
                  </div>
                  <p className="text-xs text-slate-500">Delivered on {report.lastRun}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {scheduledReports.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Scheduled Reports</h3>
            <p className="text-slate-600 mb-4">Create your first scheduled report to automate report generation</p>
            <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
