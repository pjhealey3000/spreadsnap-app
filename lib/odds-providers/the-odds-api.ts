import { OddsProvider, OddsGame, ProviderConfig } from './types'

const SPORT_KEYS: Record<'nba' | 'nfl', string> = {
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
}

interface ApiGame {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  scores?: Array<{ name: string; score: string }> | null
  bookmakers?: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
}

export class TheOddsApiProvider implements OddsProvider {
  name = 'the-odds-api'
  private apiKey: string
  private baseUrl: string

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.the-odds-api.com/v4'
  }

  async getGames(sport: 'nba' | 'nfl'): Promise<OddsGame[]> {
    const sportKey = SPORT_KEYS[sport]
    const url = `${this.baseUrl}/sports/${sportKey}/odds/?apiKey=${this.apiKey}&regions=us&markets=spreads&oddsFormat=american`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error('The Odds API error:', response.status, await response.text())
        return []
      }

      const data: ApiGame[] = await response.json()
      return data.map((game) => this.mapGame(game, sport))
    } catch (error) {
      console.error('Failed to fetch games:', error)
      return []
    }
  }

  async getLiveScores(sport: 'nba' | 'nfl'): Promise<OddsGame[]> {
    const sportKey = SPORT_KEYS[sport]
    const url = `${this.baseUrl}/sports/${sportKey}/scores/?apiKey=${this.apiKey}&daysFrom=1`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error('The Odds API scores error:', response.status)
        return []
      }

      const data: ApiGame[] = await response.json()
      
      // Filter to only live/completed games with scores
      const gamesWithScores = data.filter(g => g.scores && g.scores.length > 0)
      
      return gamesWithScores.map((game) => this.mapGameWithScores(game, sport))
    } catch (error) {
      console.error('Failed to fetch live scores:', error)
      return []
    }
  }

  async getUpcomingGames(sport: 'nba' | 'nfl'): Promise<OddsGame[]> {
    // Alias for getGames - returns upcoming games with odds
    return this.getGames(sport)
  }

  async getOpeningSpread(gameId: string): Promise<number | null> {
    // The Odds API doesn't provide historical opening lines
    // We would need to capture these when games are first listed
    return null
  }

  private mapGame(game: ApiGame, sport: 'nba' | 'nfl'): OddsGame {
    // Find the spread from the first bookmaker
    let openingSpread: number | undefined
    
    if (game.bookmakers && game.bookmakers.length > 0) {
      const spreadMarket = game.bookmakers[0].markets.find(m => m.key === 'spreads')
      if (spreadMarket) {
        const homeOutcome = spreadMarket.outcomes.find(o => o.name === game.home_team)
        if (homeOutcome?.point !== undefined) {
          openingSpread = homeOutcome.point
        }
      }
    }

    return {
      id: game.id,
      sport,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime: new Date(game.commence_time),
      status: 'scheduled',
      openingSpread,
    }
  }

  private mapGameWithScores(game: ApiGame, sport: 'nba' | 'nfl'): OddsGame {
    const homeScore = game.scores?.find(s => s.name === game.home_team)
    const awayScore = game.scores?.find(s => s.name === game.away_team)

    const commenceTime = new Date(game.commence_time)
    const now = new Date()
    
    // Determine status based on time and scores
    let status: 'scheduled' | 'live' | 'final' = 'scheduled'
    if (commenceTime <= now) {
      // Game has started - assume live unless it's been many hours
      const hoursSinceStart = (now.getTime() - commenceTime.getTime()) / (1000 * 60 * 60)
      status = hoursSinceStart > 4 ? 'final' : 'live'
    }

    return {
      id: game.id,
      sport,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime,
      status,
      homeScore: homeScore ? parseInt(homeScore.score, 10) : undefined,
      awayScore: awayScore ? parseInt(awayScore.score, 10) : undefined,
    }
  }
}
