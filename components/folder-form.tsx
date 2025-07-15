"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  accessLevel: z.enum(["public", "department", "private"]),
  isPublic: z.boolean().optional(),
  departments: z.array(z.string()).optional(),
})

interface FolderFormProps {
  folder?: {
    _id: string
    name: string
    description?: string
    accessLevel: "public" | "department" | "private"
    isPublic?: boolean
    departments?: Array<string>
  }
  onSubmit: (values: z.infer<typeof formSchema>) => void
  onCancel: () => void
  isProcessing: boolean
}

export function FolderForm({ folder, onSubmit, onCancel, isProcessing }: FolderFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: folder?.name || "",
      description: folder?.description || "",
      accessLevel: folder?.accessLevel || "department",
      isPublic: folder?.isPublic || false,
      departments: folder?.departments || [],
    },
  })

  const accessLevel = form.watch("accessLevel")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Folder Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter folder name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter folder description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accessLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="public">Public (Visible to everyone)</SelectItem>
                  <SelectItem value="department">Department (Visible to department members)</SelectItem>
                  <SelectItem value="private">Private (Only visible to you)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {accessLevel === "public" && (
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </FormControl>
                <FormLabel className="font-normal">Make this folder publicly accessible</FormLabel>
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : folder ? (
              "Update Folder"
            ) : (
              "Create Folder"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}