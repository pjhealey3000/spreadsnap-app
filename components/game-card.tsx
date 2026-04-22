'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, TrendingDown, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { Game, getTeamInfo, calculateDeviation, isFavoriteLosingBadly } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GameCardProps {
  game: Game
  threshold: number
  isWatchlisted: boolean
  onToggleWatchlist: (gameId: string) => void
}

export function GameCard({ game, threshold, isWatchlisted, onToggleWatchlist }: GameCardProps) {
  const homeTeam = getTeamInfo(game.home_team, game.sport)
  const awayTeam = getTeamInfo(game.away_team, game.sport)
  
  const deviation = calculateDeviation(game.opening_spread, game.current_home_score, game.current_away_score)
  const alertInfo = isFavoriteLosingBadly(game.opening_spread, game.current_home_score, game.current_away_score, threshold)
  
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const isAlert = alertInfo.isAlert && isLive
  
  const formatSpread = (spread: number | null) => {
    if (spread === null) return 'N/A'
    if (spread === 0) return 'PK'
    return spread > 0 ? `+${spread}` : spread.toString()
  }

  const gameTime = new Date(game.commence_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300',
      isAlert && 'ring-2 ring-primary shadow-lg shadow-primary/20',
      isLive && !isAlert && 'border-chart-1/50'
    )}>
      {isAlert && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-transparent" />
      )}
      
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant={game.sport === 'nba' ? 'default' : 'secondary'} className="uppercase text-xs font-semibold">
              {game.sport}
            </Badge>
            {isLive && (
              <Badge variant="outline" className="text-chart-1 border-chart-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-1 mr-1.5" />
                LIVE
              </Badge>
            )}
            {isFinal && (
              <Badge variant="outline" className="text-muted-foreground">
                FINAL
              </Badge>
            )}
            {!isLive && !isFinal && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {gameTime}
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              isWatchlisted && 'text-yellow-500 hover:text-yellow-400'
            )}
            onClick={() => onToggleWatchlist(game.id)}
          >
            <Star className={cn('w-4 h-4', isWatchlisted && 'fill-current')} />
          </Button>
        </div>

        {/* Teams and Scores */}
        <div className="space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                'bg-secondary text-secondary-foreground'
              )}>
                {awayTeam.short}
              </div>
              <div>
                <p className="font-medium">{awayTeam.city}</p>
                <p className="text-sm text-muted-foreground">{awayTeam.name}</p>
              </div>
            </div>
            <span className={cn(
              'text-2xl font-bold tabular-nums',
              game.current_away_score > game.current_home_score && isLive && 'text-primary'
            )}>
              {game.current_away_score}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                'bg-secondary text-secondary-foreground'
              )}>
                {homeTeam.short}
              </div>
              <div>
                <p className="font-medium">{homeTeam.city}</p>
                <p className="text-sm text-muted-foreground">{homeTeam.name}</p>
              </div>
            </div>
            <span className={cn(
              'text-2xl font-bold tabular-nums',
              game.current_home_score > game.current_away_score && isLive && 'text-primary'
            )}>
              {game.current_home_score}
            </span>
          </div>
        </div>

        {/* Spread Info */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Opening</p>
              <p className="font-semibold tabular-nums">
                {formatSpread(game.opening_spread)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="font-semibold tabular-nums">
                {game.current_home_score - game.current_away_score > 0 ? '+' : ''}
                {game.current_home_score - game.current_away_score}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deviation</p>
              <p className={cn(
                'font-semibold tabular-nums flex items-center justify-center gap-1',
                deviation >= threshold && 'text-primary',
                deviation >= threshold * 0.75 && deviation < threshold && 'text-yellow-500'
              )}>
                {deviation >= threshold ? (
                  <TrendingUp className="w-3 h-3" />
                ) : deviation >= threshold * 0.75 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                {deviation.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {isAlert && (
          <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary">Regression Alert</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {alertInfo.favoriteTeam === 'home' ? homeTeam.name : awayTeam.name} was favored by {alertInfo.expectedMargin} 
                  {' '}but is currently {alertInfo.currentMargin > 0 
                    ? `winning by ${alertInfo.currentMargin}` 
                    : alertInfo.currentMargin < 0 
                    ? `losing by ${Math.abs(alertInfo.currentMargin)}`
                    : 'tied'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
