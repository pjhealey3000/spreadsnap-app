'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty } from '@/components/ui/empty'
import { AppShell } from '@/components/app-shell'
import { GameCard } from '@/components/game-card'
import { GameGridSkeleton } from '@/components/game-card-skeleton'
import { ErrorState } from '@/components/error-state'
import { SettingsDialog } from '@/components/settings-dialog'
import { AlertsPanel } from '@/components/alerts-panel'
import { Game, UserPreferences, Alert, Sport, calculateDeviation } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Star, TrendingUp, Zap, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardClientProps {
  user: User
  initialPreferences: UserPreferences | null
  initialGames: Game[]
  initialWatchlist: string[]
  initialAlerts: Alert[]
}

type FilterTab = 'all' | 'live' | 'watchlist' | 'alerts'

export function DashboardClient({
  user,
  initialPreferences,
  initialGames,
  initialWatchlist,
  initialAlerts,
}: DashboardClientProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(initialPreferences)
  const [games, setGames] = useState<Game[]>(initialGames)
  const [watchlist, setWatchlist] = useState<string[]>(initialWatchlist)
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const threshold = preferences?.deviation_threshold ?? 20
  const unreadAlerts = alerts.filter(a => !a.acknowledged).length

  // Refresh games data
  const refreshGames = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    const supabase = createClient()
    
    const { data, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .in('status', ['live', 'scheduled'])
      .order('status', { ascending: false })
      .order('commence_time', { ascending: true })

    if (fetchError) {
      setError('Failed to load games')
    } else if (data) {
      setGames(data)
    }
    setIsRefreshing(false)
  }, [])

  // Sync odds from provider (manual trigger for Hobby tier)
  const syncOdds = useCallback(async () => {
    setIsSyncing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/sync-odds', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Failed to sync odds')
      } else {
        // Refresh games after sync
        await refreshGames()
      }
    } catch {
      setError('Failed to connect to odds provider')
    }
    
    setIsSyncing(false)
  }, [refreshGames])

  // Run alert check (manual trigger for Hobby tier)
  const runAlertCheck = useCallback(async () => {
    setIsCheckingAlerts(true)
    setError(null)
    
    try {
      const response = await fetch('/api/run-alerts', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Failed to run alert check')
      } else if (data.alertsTriggered > 0) {
        // Refresh alerts after check
        const supabase = createClient()
        const { data: newAlerts } = await supabase
          .from('alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('sent_at', { ascending: false })
          .limit(20)
        
        if (newAlerts) setAlerts(newAlerts)
      }
    } catch {
      setError('Failed to run alert check')
    }
    
    setIsCheckingAlerts(false)
  }, [user.id])

  // Auto-refresh every 30 seconds for live games
  useEffect(() => {
    const hasLiveGames = games.some(g => g.status === 'live')
    if (!hasLiveGames) return

    const interval = setInterval(refreshGames, 30000)
    return () => clearInterval(interval)
  }, [games, refreshGames])

  // Toggle watchlist
  async function toggleWatchlist(gameId: string) {
    const supabase = createClient()
    const isWatchlisted = watchlist.includes(gameId)

    if (isWatchlisted) {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId)

      if (!error) {
        setWatchlist(watchlist.filter(id => id !== gameId))
      }
    } else {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({ user_id: user.id, game_id: gameId })

      if (!error) {
        setWatchlist([...watchlist, gameId])
      }
    }
  }

  // Filter games
  const filteredGames = games.filter(game => {
    if (selectedSport !== 'all' && game.sport !== selectedSport) return false
    
    if (activeTab === 'live' && game.status !== 'live') return false
    if (activeTab === 'watchlist' && !watchlist.includes(game.id)) return false
    if (activeTab === 'alerts') {
      const deviation = calculateDeviation(game.opening_spread, game.current_home_score, game.current_away_score)
      return deviation >= threshold && game.status === 'live'
    }
    
    return true
  })

  // Stats
  const liveCount = games.filter(g => g.status === 'live').length
  const alertCount = games.filter(g => {
    const deviation = calculateDeviation(g.opening_spread, g.current_home_score, g.current_away_score)
    return deviation >= threshold && g.status === 'live'
  }).length

  return (
    <AppShell user={user} unreadAlerts={unreadAlerts}>
      <div className="container mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-1 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{liveCount}</span> Live
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{alertCount}</span> Alerts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{watchlist.length}</span> Watching
              </span>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={syncOdds}
              disabled={isSyncing}
            >
              <Download className={cn('w-4 h-4 mr-2', isSyncing && 'animate-pulse')} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Fetch Odds'}</span>
              <span className="sm:hidden">{isSyncing ? '...' : 'Odds'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runAlertCheck}
              disabled={isCheckingAlerts || liveCount === 0}
            >
              <Zap className={cn('w-4 h-4 mr-2', isCheckingAlerts && 'animate-pulse')} />
              <span className="hidden sm:inline">{isCheckingAlerts ? 'Checking...' : 'Check Alerts'}</span>
              <span className="sm:hidden">{isCheckingAlerts ? '...' : 'Alerts'}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshGames}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="live" className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-1" />
                Live
              </TabsTrigger>
              <TabsTrigger value="watchlist">
                <Star className="w-3.5 h-3.5" />
              </TabsTrigger>
              <TabsTrigger value="alerts" className="relative">
                <Zap className="w-3.5 h-3.5" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
                    {alertCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Badge
              variant={selectedSport === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedSport('all')}
            >
              All Sports
            </Badge>
            <Badge
              variant={selectedSport === 'nba' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedSport('nba')}
            >
              NBA
            </Badge>
            <Badge
              variant={selectedSport === 'nfl' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedSport('nfl')}
            >
              NFL
            </Badge>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorState 
            message={error}
            onRetry={refreshGames}
          />
        )}

        {/* Loading State */}
        {isRefreshing && games.length === 0 && (
          <GameGridSkeleton count={6} />
        )}

        {/* Games Grid */}
        {!error && !isRefreshing && filteredGames.length === 0 && (
          <Empty
            icon={<TrendingUp className="w-12 h-12" />}
            title={activeTab === 'alerts' ? 'No alerts right now' : 'No games found'}
            description={
              activeTab === 'alerts'
                ? 'Games will appear here when spreads deviate beyond your threshold'
                : activeTab === 'watchlist'
                ? 'Star games to add them to your watchlist'
                : 'Check back when games are scheduled or live'
            }
          />
        )}

        {!error && filteredGames.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                threshold={threshold}
                isWatchlisted={watchlist.includes(game.id)}
                onToggleWatchlist={toggleWatchlist}
              />
            ))}
          </div>
        )}
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        preferences={preferences}
        onPreferencesUpdate={(updates) => {
          if (preferences) {
            setPreferences({ ...preferences, ...updates })
          }
        }}
      />

      <AlertsPanel
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        alerts={alerts}
        games={games}
        onAlertAcknowledged={(alertId) => {
          setAlerts(alerts.map(a => 
            a.id === alertId ? { ...a, acknowledged: true } : a
          ))
        }}
      />
    </AppShell>
  )
}
