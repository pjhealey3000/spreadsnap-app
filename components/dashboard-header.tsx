'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Settings, LogOut, TrendingUp, User } from 'lucide-react'
import { NotificationToggle } from './notification-toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  email: string
  unreadAlerts: number
  onOpenSettings: () => void
  onOpenAlerts: () => void
}

export function DashboardHeader({ email, unreadAlerts, onOpenSettings, onOpenAlerts }: DashboardHeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">SpreadSnap</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Live Spread Deviation Alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationToggle />

          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={onOpenAlerts}
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
              >
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </Badge>
            )}
          </Button>

          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium truncate">{email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
