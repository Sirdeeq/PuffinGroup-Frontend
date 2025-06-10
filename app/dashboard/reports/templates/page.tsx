"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Edit, Trash2, Copy, Download, BarChart3, TrendingUp, Users, Building2 } from "lucide-react"

export default function ReportTemplatesPage() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Monthly Department Summary",
      description: "Comprehensive monthly overview of all department activities",
      type: "department",
      frequency: "monthly",
      lastUsed: "2024-01-15",
      isDefault: true,
      sections: ["overview", "charts", "tables"],
    },
    {
      id: 2,
      name: "Weekly File Status Report",
      description: "Weekly summary of file processing and approval status",
      type: "files",
      frequency: "weekly",
      lastUsed: "2024-01-20",
      isDefault: false,
      sections: ["overview", "trends"],
    },
    {
      id: 3,
      name: "User Activity Analysis",
      description: "Detailed analysis of user engagement and productivity",
      type: "users",
      frequency: "quarterly",
      lastUsed: "2024-01-10",
      isDefault: false,
      sections: ["charts", "tables"],
    },
  ])

  const [isCreating, setIsCreating] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    type: "overview",
    frequency: "monthly",
    sections: [] as string[],
  })

  const templateTypes = [
    { value: "overview", label: "System Overview", icon: BarChart3 },
    { value: "files", label: "Files Report", icon: FileText },
    { value: "requests", label: "Requests Report", icon: Users },
    { value: "departments", label: "Department Analysis", icon: Building2 },
    { value: "users", label: "User Activity", icon: Users },
    { value: "performance", label: "Performance Metrics", icon: TrendingUp },
  ]

  const reportSections = [
    { value: "overview", label: "Overview Summary" },
    { value: "charts", label: "Charts & Graphs" },
    { value: "tables", label: "Data Tables" },
    { value: "trends", label: "Trend Analysis" },
  ]

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ]

  const handleSectionToggle = (section: string) => {
    setNewTemplate((prev) => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section],
    }))
  }

  const createTemplate = () => {
    const template = {
      id: templates.length + 1,
      ...newTemplate,
      lastUsed: new Date().toISOString().split("T")[0],
      isDefault: false,
    }
    setTemplates((prev) => [...prev, template])
    setNewTemplate({
      name: "",
      description: "",
      type: "overview",
      frequency: "monthly",
      sections: [],
    })
    setIsCreating(false)
  }

  const duplicateTemplate = (template: any) => {
    const newTemplate = {
      ...template,
      id: templates.length + 1,
      name: `${template.name} (Copy)`,
      isDefault: false,
      lastUsed: new Date().toISOString().split("T")[0],
    }
    setTemplates((prev) => [...prev, newTemplate])
  }

  const deleteTemplate = (id: number) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = templateTypes.find((t) => t.value === type)
    return typeConfig?.icon || FileText
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
      case "yearly":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Report Templates</h1>
          <p className="text-slate-600 mt-1">Create and manage reusable report templates</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>Define a new report template for recurring use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="Enter template name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">Report Type</Label>
                <select
                  id="template-type"
                  className="w-full p-2 border border-slate-300 rounded-md"
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate((prev) => ({ ...prev, type: e.target.value }))}
                >
                  {templateTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Describe what this template is used for"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="template-frequency">Default Frequency</Label>
                <select
                  id="template-frequency"
                  className="w-full p-2 border border-slate-300 rounded-md"
                  value={newTemplate.frequency}
                  onChange={(e) => setNewTemplate((prev) => ({ ...prev, frequency: e.target.value }))}
                >
                  {frequencies.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Report Sections</Label>
                <div className="grid grid-cols-2 gap-2">
                  {reportSections.map((section) => (
                    <label key={section.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTemplate.sections.includes(section.value)}
                        onChange={() => handleSectionToggle(section.value)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createTemplate} className="bg-orange-500 hover:bg-orange-600">
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="default">Default Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const IconComponent = getTypeIcon(template.type)
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                          <IconComponent className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          {template.isDefault && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 mt-1">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={getFrequencyColor(template.frequency)}>
                        {template.frequency.charAt(0).toUpperCase() + template.frequency.slice(1)}
                      </Badge>
                      <span className="text-sm text-slate-500">Last used: {template.lastUsed}</span>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sections:</Label>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.map((section) => (
                          <Badge key={section} variant="outline" className="text-xs">
                            {reportSections.find((s) => s.value === section)?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => duplicateTemplate(template)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        <Download className="w-4 h-4 mr-1" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="default">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter((t) => t.isDefault)
              .map((template) => {
                const IconComponent = getTypeIcon(template.type)
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className="text-blue-600 border-blue-200 mt-1">
                            System Default
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-blue-500 hover:bg-blue-600">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter((t) => !t.isDefault)
              .map((template) => {
                const IconComponent = getTypeIcon(template.type)
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <IconComponent className="w-5 h-5 text-green-600" />
                        </div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getFrequencyColor(template.frequency)}>
                          {template.frequency.charAt(0).toUpperCase() + template.frequency.slice(1)}
                        </Badge>
                        <span className="text-sm text-slate-500">{template.lastUsed}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                          <Download className="w-4 h-4 mr-1" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
