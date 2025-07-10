import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function RequestInboxLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 sm:w-64" />
              <Skeleton className="h-4 w-32 sm:w-48" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Skeleton */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-4 sm:p-8">
          <div className="space-y-4">
            <Skeleton className="h-12 sm:h-14 w-full max-w-2xl mx-auto rounded-xl" />
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
