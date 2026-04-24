'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Bell, Check, Clock, TrendingUp } from 'lucide-react'
import { Alert, Game, getTeamInfo } from '@/lib/types'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface AlertsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alerts: Alert[]
  games: Game[]
  onAlertAcknowledged: (alertId: string) => void
}

export function AlertsPanel({ open, onOpenChange, alerts, games, onAlertAcknowledged }: AlertsPanelProps) {
  const getGame = (gameId: string) => games.find(g => g.id === gameId)

  async function acknowledgeAlert(alertId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', alertId)

    if (!error) {
      onAlertAcknowledged(alertId)
    }
  }

  async function acknowledgeAll() {
    const supabase = createClient()
    const unacknowledged = alerts.filter(a => !a.acknowledged).map(a => a.id)
    
    if (unacknowledged.length === 0) return

    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .in('id', unacknowledged)

    if (!error) {
      unacknowledged.forEach(id => onAlertAcknowledged(id))
    }
  }

  const unreadCount = alerts.filter(a => !a.acknowledged).length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Alerts
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={acknowledgeAll}>
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>
            Notifications for significant spread deviations
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {alerts.length === 0 ? (
            <Empty
              icon={<Bell className="w-10 h-10" />}
              title="No alerts yet"
              description="You'll see notifications here when spreads deviate significantly"
            />
          ) : (
            alerts.map(alert => {
              const game = getGame(alert.game_id)
              if (!game) return null

              const homeTeam = getTeamInfo(game.home_team)
              const awayTeam = getTeamInfo(game.away_team)

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    alert.acknowledged 
                      ? 'bg-card border-border' 
                      : 'bg-primary/5 border-primary/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      alert.acknowledged ? 'bg-muted' : 'bg-primary/10'
                    )}>
                      <TrendingUp className={cn(
                        'w-5 h-5',
                        alert.acknowledged ? 'text-muted-foreground' : 'text-primary'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs uppercase">
                          {game.sport}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.sent_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {awayTeam.abbreviation} @ {homeTeam.abbreviation}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-primary mt-2">
                        Deviation: {alert.deviation_amount.toFixed(0)} points
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
