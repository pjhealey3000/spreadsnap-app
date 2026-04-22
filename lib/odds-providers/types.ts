// Odds Provider Abstraction Layer
// Allows swapping between The Odds API, Sportradar, etc.

export interface OddsGame {
  id: string
  sport: 'nba' | 'nfl'
  homeTeam: string
  awayTeam: string
  commenceTime: Date
  status: 'scheduled' | 'live' | 'final'
  homeScore?: number
  awayScore?: number
  openingSpread?: number // positive = home favorite
  currentSpread?: number
}

export interface OddsProvider {
  name: string
  
  // Fetch upcoming and live games
  getGames(sport: 'nba' | 'nfl'): Promise<OddsGame[]>
  
  // Fetch live scores for active games
  getLiveScores(sport: 'nba' | 'nfl'): Promise<OddsGame[]>
  
  // Get opening spread for a specific game
  getOpeningSpread(gameId: string): Promise<number | null>
}

export interface ProviderConfig {
  apiKey: string
  baseUrl?: string
}
