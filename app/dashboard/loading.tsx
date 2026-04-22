import { Spinner } from '@/components/ui/spinner'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="w-8 h-8" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  )
}
