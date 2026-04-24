export type Sport = 'nba' | 'nfl'

export interface Game {
  id: string
  external_id: string
  provider: string
  provider_game_id: string
  sport: Sport
  home_team: string
  away_team: string
  opening_spread: number | null
  current_home_score: number
  current_away_score: number
  status: 'scheduled' | 'live' | 'final'
  commence_time: string
  last_updated: string
}

export interface UserPreferences {
  id: string
  user_id: string
  deviation_threshold: number
  sports: Sport[]
  push_subscription: PushSubscription | null
  email: string | null
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  user_id: string
  game_id: string
  deviation_amount: number
  message: string
  sent_at: string
  acknowledged: boolean
}

export interface AlertRule {
  id: string
  user_id: string
  name: string
  sport: Sport | 'all'
  team: string | null
  deviation_threshold: number
  direction: 'favorite_losing' | 'underdog_winning' | 'any'
  is_active: boolean
  created_at: string
}

// Team info for display
export interface TeamInfo {
  name: string
  city: string
  short: string
  abbreviation: string
  primaryColor: string
}

const NBA_TEAMS: Record<string, TeamInfo> = {
  'Atlanta Hawks': { name: 'Hawks', city: 'Atlanta', short: 'ATL', abbreviation: 'ATL', primaryColor: '#E03A3E' },
  'Boston Celtics': { name: 'Celtics', city: 'Boston', short: 'BOS', abbreviation: 'BOS', primaryColor: '#007A33' },
  'Brooklyn Nets': { name: 'Nets', city: 'Brooklyn', short: 'BKN', abbreviation: 'BKN', primaryColor: '#000000' },
  'Charlotte Hornets': { name: 'Hornets', city: 'Charlotte', short: 'CHA', abbreviation: 'CHA', primaryColor: '#1D1160' },
  'Chicago Bulls': { name: 'Bulls', city: 'Chicago', short: 'CHI', abbreviation: 'CHI', primaryColor: '#CE1141' },
  'Cleveland Cavaliers': { name: 'Cavaliers', city: 'Cleveland', short: 'CLE', abbreviation: 'CLE', primaryColor: '#860038' },
  'Dallas Mavericks': { name: 'Mavericks', city: 'Dallas', short: 'DAL', abbreviation: 'DAL', primaryColor: '#00538C' },
  'Denver Nuggets': { name: 'Nuggets', city: 'Denver', short: 'DEN', abbreviation: 'DEN', primaryColor: '#0E2240' },
  'Detroit Pistons': { name: 'Pistons', city: 'Detroit', short: 'DET', abbreviation: 'DET', primaryColor: '#C8102E' },
  'Golden State Warriors': { name: 'Warriors', city: 'Golden State', short: 'GSW', abbreviation: 'GSW', primaryColor: '#1D428A' },
  'Houston Rockets': { name: 'Rockets', city: 'Houston', short: 'HOU', abbreviation: 'HOU', primaryColor: '#CE1141' },
  'Indiana Pacers': { name: 'Pacers', city: 'Indiana', short: 'IND', abbreviation: 'IND', primaryColor: '#002D62' },
  'LA Clippers': { name: 'Clippers', city: 'LA', short: 'LAC', abbreviation: 'LAC', primaryColor: '#C8102E' },
  'Los Angeles Lakers': { name: 'Lakers', city: 'Los Angeles', short: 'LAL', abbreviation: 'LAL', primaryColor: '#552583' },
  'Memphis Grizzlies': { name: 'Grizzlies', city: 'Memphis', short: 'MEM', abbreviation: 'MEM', primaryColor: '#5D76A9' },
  'Miami Heat': { name: 'Heat', city: 'Miami', short: 'MIA', abbreviation: 'MIA', primaryColor: '#98002E' },
  'Milwaukee Bucks': { name: 'Bucks', city: 'Milwaukee', short: 'MIL', abbreviation: 'MIL', primaryColor: '#00471B' },
  'Minnesota Timberwolves': { name: 'Timberwolves', city: 'Minnesota', short: 'MIN', abbreviation: 'MIN', primaryColor: '#0C2340' },
  'New Orleans Pelicans': { name: 'Pelicans', city: 'New Orleans', short: 'NOP', abbreviation: 'NOP', primaryColor: '#0C2340' },
  'New York Knicks': { name: 'Knicks', city: 'New York', short: 'NYK', abbreviation: 'NYK', primaryColor: '#006BB6' },
  'Oklahoma City Thunder': { name: 'Thunder', city: 'Oklahoma City', short: 'OKC', abbreviation: 'OKC', primaryColor: '#007AC1' },
  'Orlando Magic': { name: 'Magic', city: 'Orlando', short: 'ORL', abbreviation: 'ORL', primaryColor: '#0077C0' },
  'Philadelphia 76ers': { name: '76ers', city: 'Philadelphia', short: 'PHI', abbreviation: 'PHI', primaryColor: '#006BB6' },
  'Phoenix Suns': { name: 'Suns', city: 'Phoenix', short: 'PHX', abbreviation: 'PHX', primaryColor: '#1D1160' },
  'Portland Trail Blazers': { name: 'Trail Blazers', city: 'Portland', short: 'POR', abbreviation: 'POR', primaryColor: '#E03A3E' },
  'Sacramento Kings': { name: 'Kings', city: 'Sacramento', short: 'SAC', abbreviation: 'SAC', primaryColor: '#5A2D81' },
  'San Antonio Spurs': { name: 'Spurs', city: 'San Antonio', short: 'SAS', abbreviation: 'SAS', primaryColor: '#C4CED4' },
  'Toronto Raptors': { name: 'Raptors', city: 'Toronto', short: 'TOR', abbreviation: 'TOR', primaryColor: '#CE1141' },
  'Utah Jazz': { name: 'Jazz', city: 'Utah', short: 'UTA', abbreviation: 'UTA', primaryColor: '#002B5C' },
  'Washington Wizards': { name: 'Wizards', city: 'Washington', short: 'WAS', abbreviation: 'WAS', primaryColor: '#002B5C' },
}

const NFL_TEAMS: Record<string, TeamInfo> = {
  'Arizona Cardinals': { name: 'Cardinals', city: 'Arizona', short: 'ARI', abbreviation: 'ARI', primaryColor: '#97233F' },
  'Atlanta Falcons': { name: 'Falcons', city: 'Atlanta', short: 'ATL', abbreviation: 'ATL', primaryColor: '#A71930' },
  'Baltimore Ravens': { name: 'Ravens', city: 'Baltimore', short: 'BAL', abbreviation: 'BAL', primaryColor: '#241773' },
  'Buffalo Bills': { name: 'Bills', city: 'Buffalo', short: 'BUF', abbreviation: 'BUF', primaryColor: '#00338D' },
  'Carolina Panthers': { name: 'Panthers', city: 'Carolina', short: 'CAR', abbreviation: 'CAR', primaryColor: '#0085CA' },
  'Chicago Bears': { name: 'Bears', city: 'Chicago', short: 'CHI', abbreviation: 'CHI', primaryColor: '#0B162A' },
  'Cincinnati Bengals': { name: 'Bengals', city: 'Cincinnati', short: 'CIN', abbreviation: 'CIN', primaryColor: '#FB4F14' },
  'Cleveland Browns': { name: 'Browns', city: 'Cleveland', short: 'CLE', abbreviation: 'CLE', primaryColor: '#311D00' },
  'Dallas Cowboys': { name: 'Cowboys', city: 'Dallas', short: 'DAL', abbreviation: 'DAL', primaryColor: '#003594' },
  'Denver Broncos': { name: 'Broncos', city: 'Denver', short: 'DEN', abbreviation: 'DEN', primaryColor: '#FB4F14' },
  'Detroit Lions': { name: 'Lions', city: 'Detroit', short: 'DET', abbreviation: 'DET', primaryColor: '#0076B6' },
  'Green Bay Packers': { name: 'Packers', city: 'Green Bay', short: 'GB', abbreviation: 'GB', primaryColor: '#203731' },
  'Houston Texans': { name: 'Texans', city: 'Houston', short: 'HOU', abbreviation: 'HOU', primaryColor: '#03202F' },
  'Indianapolis Colts': { name: 'Colts', city: 'Indianapolis', short: 'IND', abbreviation: 'IND', primaryColor: '#002C5F' },
  'Jacksonville Jaguars': { name: 'Jaguars', city: 'Jacksonville', short: 'JAX', abbreviation: 'JAX', primaryColor: '#006778' },
  'Kansas City Chiefs': { name: 'Chiefs', city: 'Kansas City', short: 'KC', abbreviation: 'KC', primaryColor: '#E31837' },
  'Las Vegas Raiders': { name: 'Raiders', city: 'Las Vegas', short: 'LV', abbreviation: 'LV', primaryColor: '#000000' },
  'Los Angeles Chargers': { name: 'Chargers', city: 'Los Angeles', short: 'LAC', abbreviation: 'LAC', primaryColor: '#0080C6' },
  'Los Angeles Rams': { name: 'Rams', city: 'Los Angeles', short: 'LAR', abbreviation: 'LAR', primaryColor: '#003594' },
  'Miami Dolphins': { name: 'Dolphins', city: 'Miami', short: 'MIA', abbreviation: 'MIA', primaryColor: '#008E97' },
  'Minnesota Vikings': { name: 'Vikings', city: 'Minnesota', short: 'MIN', abbreviation: 'MIN', primaryColor: '#4F2683' },
  'New England Patriots': { name: 'Patriots', city: 'New England', short: 'NE', abbreviation: 'NE', primaryColor: '#002244' },
  'New Orleans Saints': { name: 'Saints', city: 'New Orleans', short: 'NO', abbreviation: 'NO', primaryColor: '#D3BC8D' },
  'New York Giants': { name: 'Giants', city: 'New York', short: 'NYG', abbreviation: 'NYG', primaryColor: '#0B2265' },
  'New York Jets': { name: 'Jets', city: 'New York', short: 'NYJ', abbreviation: 'NYJ', primaryColor: '#125740' },
  'Philadelphia Eagles': { name: 'Eagles', city: 'Philadelphia', short: 'PHI', abbreviation: 'PHI', primaryColor: '#004C54' },
  'Pittsburgh Steelers': { name: 'Steelers', city: 'Pittsburgh', short: 'PIT', abbreviation: 'PIT', primaryColor: '#FFB612' },
  'San Francisco 49ers': { name: '49ers', city: 'San Francisco', short: 'SF', abbreviation: 'SF', primaryColor: '#AA0000' },
  'Seattle Seahawks': { name: 'Seahawks', city: 'Seattle', short: 'SEA', abbreviation: 'SEA', primaryColor: '#002244' },
  'Tampa Bay Buccaneers': { name: 'Buccaneers', city: 'Tampa Bay', short: 'TB', abbreviation: 'TB', primaryColor: '#D50A0A' },
  'Tennessee Titans': { name: 'Titans', city: 'Tennessee', short: 'TEN', abbreviation: 'TEN', primaryColor: '#0C2340' },
  'Washington Commanders': { name: 'Commanders', city: 'Washington', short: 'WAS', abbreviation: 'WAS', primaryColor: '#5A1414' },
}

export function getTeamInfo(teamName: string): TeamInfo {
  return (
    NBA_TEAMS[teamName] ||
    NFL_TEAMS[teamName] || {
      name: teamName,
      city: '',
      short: teamName.slice(0, 3).toUpperCase(),
      abbreviation: teamName.slice(0, 3).toUpperCase(),
      primaryColor: '#666666',
    }
  )
}

/**
 * Calculate the deviation from opening spread
 * Returns absolute deviation in points
 */
export function calculateDeviation(
  openingSpread: number | null,
  homeScore: number,
  awayScore: number
): number {
  if (openingSpread === null) return 0

  const actualDiff = homeScore - awayScore
  const expectedDiff = -openingSpread // negative spread = home favored
  
  return Math.abs(expectedDiff - actualDiff)
}

export interface AlertInfo {
  isAlert: boolean
  favoriteTeam: 'home' | 'away'
  expectedMargin: number
  currentMargin: number
}

/**
 * Check if the favorite is losing badly (regression opportunity)
 * Returns detailed alert info for UI display
 */
export function isFavoriteLosingBadly(
  openingSpread: number | null,
  homeScore: number,
  awayScore: number,
  threshold: number = 15
): AlertInfo {
  if (openingSpread === null) {
    return { isAlert: false, favoriteTeam: 'home', expectedMargin: 0, currentMargin: 0 }
  }

  const currentMargin = homeScore - awayScore
  const homeFavored = openingSpread < 0
  const expectedMargin = Math.abs(openingSpread)
  const favoriteTeam = homeFavored ? 'home' : 'away'

  // Calculate deviation
  const expectedDiff = homeFavored ? expectedMargin : -expectedMargin
  const deviation = Math.abs(expectedDiff - currentMargin)

  // Favorite is losing if:
  // - Home was favored but away is winning
  // - Away was favored but home is winning
  const isFavoriteLosing = (homeFavored && currentMargin < 0) || (!homeFavored && currentMargin > 0)

  return {
    isAlert: deviation >= threshold && isFavoriteLosing,
    favoriteTeam,
    expectedMargin,
    currentMargin,
  }
}
