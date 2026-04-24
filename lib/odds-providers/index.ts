import { OddsProvider } from './types'
import { TheOddsApiProvider } from './the-odds-api'

export type ProviderName = 'the-odds-api' | 'sportradar' | 'mock'

export function createOddsProvider(name: ProviderName = 'the-odds-api'): OddsProvider {
  const apiKey = process.env.ODDS_API_KEY
  
  switch (name) {
    case 'the-odds-api':
      if (!apiKey) {
        console.warn('ODDS_API_KEY not set, using mock provider')
        return createMockProvider()
      }
      return new TheOddsApiProvider({ apiKey })
    
    case 'sportradar':
      // Future: implement Sportradar provider
      throw new Error('Sportradar provider not yet implemented')
    
    case 'mock':
    default:
      return createMockProvider()
  }
}

// Mock provider for development/testing
function createMockProvider(): OddsProvider {
  return {
    name: 'mock',
    
    async getGames() {
      // Return empty - we use seeded DB data in dev
      return []
    },
    
    async getUpcomingGames() {
      // Alias for getGames
      return []
    },
    
    async getLiveScores() {
      return []
    },
    
    async getOpeningSpread() {
      return null
    },
  }
}

export * from './types'
