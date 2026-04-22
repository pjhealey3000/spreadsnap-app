'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  History,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'

interface GameWithSnapshots {
  id: string
  sport: string
  home_team: string
  away_team: string
  opening_spread: number
  current_home_score: number
  current_away_score: number
  status: string
  commence_time: string
  snapshots: Array<{
    id: string
    home_score: number
    away_score: number
    deviation: number
    captured_at: string
  }>
  final_deviation?: number
  regression_occurred?: boolean
}

// Example historical data - replaced with real data as games complete
const EXAMPLE_HISTORICAL_GAMES: GameWithSnapshots[] = [
  {
    id: '1',
    sport: 'nba',
    home_team: 'Golden State Warriors',
    away_team: 'Portland Trail Blazers',
    opening_spread: 8.5,
    current_home_score: 112,
    current_away_score: 108,
    status: 'final',
    commence_time: '2026-04-15T19:00:00Z',
    snapshots: [
      { id: 's1', home_score: 22, away_score: 28, deviation: -14.5, captured_at: '2026-04-15T19:15:00Z' },
      { id: 's2', home_score: 48, away_score: 62, deviation: -22.5, captured_at: '2026-04-15T19:30:00Z' },
      { id: 's3', home_score: 72, away_score: 78, deviation: -14.5, captured_at: '2026-04-15T20:00:00Z' },
      { id: 's4', home_score: 95, away_score: 98, deviation: -11.5, captured_at: '2026-04-15T20:30:00Z' },
    ],
    final_deviation: -4.5,
    regression_occurred: true,
  },
  {
    id: '2',
    sport: 'nfl',
    home_team: 'Kansas City Chiefs',
    away_team: 'Las Vegas Raiders',
    opening_spread: 10.5,
    current_home_score: 31,
    current_away_score: 17,
    status: 'final',
    commence_time: '2026-04-14T13:00:00Z',
    snapshots: [
      { id: 's5', home_score: 0, away_score: 14, deviation: -24.5, captured_at: '2026-04-14T13:30:00Z' },
      { id: 's6', home_score: 7, away_score: 17, deviation: -20.5, captured_at: '2026-04-14T14:00:00Z' },
      { id: 's7', home_score: 21, away_score: 17, deviation: -6.5, captured_at: '2026-04-14T15:00:00Z' },
    ],
    final_deviation: 3.5,
    regression_occurred: true,
  },
  {
    id: '3',
    sport: 'nba',
    home_team: 'Boston Celtics',
    away_team: 'Miami Heat',
    opening_spread: -2.5,
    current_home_score: 98,
    current_away_score: 115,
    status: 'final',
    commence_time: '2026-04-13T20:00:00Z',
    snapshots: [
      { id: 's8', home_score: 18, away_score: 32, deviation: -16.5, captured_at: '2026-04-13T20:15:00Z' },
      { id: 's9', home_score: 42, away_score: 58, deviation: -18.5, captured_at: '2026-04-13T20:45:00Z' },
      { id: 's10', home_score: 68, away_score: 88, deviation: -22.5, captured_at: '2026-04-13T21:15:00Z' },
    ],
    final_deviation: -19.5,
    regression_occurred: false,
  },
]

export default function BacktestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [games, setGames] = useState<GameWithSnapshots[]>([])
  const [sportFilter, setSportFilter] = useState<'all' | 'nba' | 'nfl'>('all')
  const [deviationFilter, setDeviationFilter] = useState<number>(15)
  const [usingExampleData, setUsingExampleData] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Try to load real data first
        const { data: realGames } = await supabase
          .from('games')
          .select(`
            *,
            snapshots:odds_snapshots(*)
          `)
          .eq('status', 'final')
          .order('commence_time', { ascending: false })
          .limit(50)
        
        if (realGames && realGames.length > 0) {
          // Process real games
          const processed = realGames.map(game => ({
            ...game,
            snapshots: game.snapshots || [],
            final_deviation: calculateDeviation(
              game.current_home_score,
              game.current_away_score,
              game.opening_spread
            ),
          })).map(game => ({
            ...game,
            regression_occurred: didRegressionOccur(game),
          }))
          setGames(processed as GameWithSnapshots[])
        } else {
          // Show example data until real games complete
          setGames(EXAMPLE_HISTORICAL_GAMES)
          setUsingExampleData(true)
        }
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  function calculateDeviation(homeScore: number, awayScore: number, spread: number): number {
    const actualMargin = homeScore - awayScore
    return actualMargin - spread
  }

  function didRegressionOccur(game: GameWithSnapshots): boolean {
    if (!game.snapshots || game.snapshots.length === 0) return false
    
    const maxDeviation = Math.max(...game.snapshots.map(s => Math.abs(s.deviation)))
    const finalDeviation = Math.abs(game.final_deviation || 0)
    
    // Regression occurred if final deviation is at least 50% less than max deviation
    return finalDeviation < maxDeviation * 0.5
  }

  const filteredGames = games.filter(game => {
    if (sportFilter !== 'all' && game.sport !== sportFilter) return false
    
    const maxDeviation = game.snapshots.length > 0 
      ? Math.max(...game.snapshots.map(s => Math.abs(s.deviation)))
      : 0
    
    return maxDeviation >= deviationFilter
  })

  const stats = {
    totalGames: filteredGames.length,
    regressionCount: filteredGames.filter(g => g.regression_occurred).length,
    regressionRate: filteredGames.length > 0 
      ? Math.round((filteredGames.filter(g => g.regression_occurred).length / filteredGames.length) * 100)
      : 0,
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <AppShell user={user}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Historical Backtest</h1>
          <p className="text-muted-foreground">
            Analyze past games where significant spread deviations occurred. 
            See how often scores regressed toward the opening spread.
          </p>
        </div>

        {usingExampleData && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-sm text-muted-foreground">
                Showing example data. Real historical data will appear as games complete.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sport:</span>
              <Select value={sportFilter} onValueChange={(v) => setSportFilter(v as typeof sportFilter)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="nba">NBA</SelectItem>
                  <SelectItem value="nfl">NFL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Min Deviation:</span>
              <Select value={String(deviationFilter)} onValueChange={(v) => setDeviationFilter(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10+ pts</SelectItem>
                  <SelectItem value="15">15+ pts</SelectItem>
                  <SelectItem value="20">20+ pts</SelectItem>
                  <SelectItem value="25">25+ pts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalGames}</p>
                  <p className="text-sm text-muted-foreground">Games Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.regressionCount}</p>
                  <p className="text-sm text-muted-foreground">Regressions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.regressionRate}%</p>
                  <p className="text-sm text-muted-foreground">Regression Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insight */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <History className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Regression to the Mean</p>
                <p className="text-sm text-muted-foreground">
                  When games show a {deviationFilter}+ point deviation from the opening spread during play, 
                  the final score tends to regress closer to the spread {stats.regressionRate}% of the time. 
                  This creates potential value for in-game betting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Historical Games</h2>
          
          {filteredGames.length === 0 ? (
            <Empty
              icon={<History className="w-12 h-12" />}
              title="No historical data"
              description="Games with significant deviations will appear here after they complete"
            />
          ) : (
            <div className="space-y-3">
              {filteredGames.map(game => {
                const maxDeviation = Math.max(...game.snapshots.map(s => Math.abs(s.deviation)))
                
                return (
                  <Card key={game.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            game.regression_occurred ? 'bg-primary/10' : 'bg-destructive/10'
                          }`}>
                            {game.regression_occurred 
                              ? <CheckCircle className="w-5 h-5 text-primary" />
                              : <XCircle className="w-5 h-5 text-destructive" />
                            }
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {game.away_team} @ {game.home_team}
                              </span>
                              <Badge variant="outline" className="text-xs uppercase">
                                {game.sport}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Final: {game.current_away_score} - {game.current_home_score}
                              {' · '}
                              Opening Spread: {game.opening_spread > 0 ? '+' : ''}{game.opening_spread}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Max Deviation</p>
                              <p className="font-bold text-lg text-destructive">
                                {maxDeviation > 0 ? '+' : ''}{maxDeviation.toFixed(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Final Deviation</p>
                              <p className={`font-bold text-lg ${
                                game.regression_occurred ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                                {(game.final_deviation || 0) > 0 ? '+' : ''}{(game.final_deviation || 0).toFixed(1)}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={game.regression_occurred ? 'default' : 'secondary'}
                            className="mt-2"
                          >
                            {game.regression_occurred ? 'Regression Occurred' : 'No Regression'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Deviation Timeline */}
                      {game.snapshots.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Deviation Timeline</p>
                          <div className="flex items-center gap-2">
                            {game.snapshots.map((snapshot, i) => (
                              <div 
                                key={snapshot.id}
                                className="flex-1 text-center"
                              >
                                <div className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                                  Math.abs(snapshot.deviation) >= 20 
                                    ? 'bg-destructive/20 text-destructive' 
                                    : Math.abs(snapshot.deviation) >= 15
                                    ? 'bg-amber-500/20 text-amber-600'
                                    : 'bg-secondary text-muted-foreground'
                                }`}>
                                  {snapshot.deviation > 0 ? '+' : ''}{snapshot.deviation}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {snapshot.home_score}-{snapshot.away_score}
                                </p>
                              </div>
                            ))}
                            <div className="flex-1 text-center">
                              <div className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                                game.regression_occurred 
                                  ? 'bg-primary/20 text-primary' 
                                  : 'bg-secondary text-muted-foreground'
                              }`}>
                                {(game.final_deviation || 0) > 0 ? '+' : ''}{(game.final_deviation || 0).toFixed(1)}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">Final</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
