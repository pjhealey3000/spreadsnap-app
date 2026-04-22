import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function GameCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-5 rounded" />
            <Skeleton className="w-16 h-5 rounded" />
          </div>
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-5 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

export function GameGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  )
}
