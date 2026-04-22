'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { 
  TrendingUp, 
  LayoutDashboard, 
  Settings, 
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  CreditCard,
  History,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NotificationToggle } from './notification-toggle'

interface AppShellProps {
  user: User
  children: React.ReactNode
  unreadAlerts?: number
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/rules', label: 'Alert Rules', icon: Bell },
  { href: '/dashboard/backtest', label: 'Backtest', icon: History },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ user, children, unreadAlerts = 0 }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b border-border">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold">SpreadSnap</span>
                  </Link>
                </div>
                <nav className="p-4 space-y-1">
                  {navItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        pathname === item.href
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold hidden sm:inline">SpreadSnap</span>
              <Badge variant="outline" className="text-xs font-normal hidden sm:inline-flex">Beta</Badge>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <NotificationToggle />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              asChild
            >
              <Link href="/dashboard?tab=alerts">
                <Bell className="w-5 h-5" />
                {unreadAlerts > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </Badge>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserIcon className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings?tab=billing" className="cursor-pointer">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
