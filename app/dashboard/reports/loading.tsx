import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="text-lg font-medium text-slate-600">Loading reports...</p>
      </div>
    </div>
  )
}
