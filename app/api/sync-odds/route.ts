import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createOddsProvider } from "@/lib/odds-providers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Manual sync endpoint for Hobby tier deployment.
 * Fetches latest odds and updates games in the database.
 * Requires authenticated user session.
 */
export async function POST() {
  // Verify user is authenticated
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 })
  }

  const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey)
  const provider = createOddsProvider()

  try {
    let gamesUpdated = 0
    let gamesCreated = 0

    // Only sync if ODDS_API_KEY is set
    if (!process.env.ODDS_API_KEY) {
      return NextResponse.json({ 
        message: "ODDS_API_KEY not configured - using existing data",
        gamesUpdated: 0,
        gamesCreated: 0 
      })
    }

    for (const sport of ['nba', 'nfl'] as const) {
      // Fetch upcoming games with odds
      const upcomingGames = await provider.getUpcomingGames(sport)
      
      for (const game of upcomingGames) {
        const { data: existing } = await serviceClient
          .from("games")
          .select("id")
          .eq("external_id", game.id)
          .single()

        const gameData = {
          external_id: game.id,
          provider: provider.name,
          provider_game_id: game.id,
          sport: game.sport,
          home_team: game.homeTeam,
          away_team: game.awayTeam,
          opening_spread: game.openingSpread,
          current_home_score: game.homeScore ?? 0,
          current_away_score: game.awayScore ?? 0,
          status: game.status,
          commence_time: game.commenceTime.toISOString(),
          last_updated: new Date().toISOString(),
        }

        if (existing) {
          await serviceClient
            .from("games")
            .update(gameData)
            .eq("external_id", game.id)
          gamesUpdated++
        } else {
          await serviceClient
            .from("games")
            .insert(gameData)
          gamesCreated++
        }
      }

      // Also fetch live scores
      const liveGames = await provider.getLiveScores(sport)
      
      for (const game of liveGames) {
        await serviceClient
          .from("games")
          .upsert({
            external_id: game.id,
            provider: provider.name,
            provider_game_id: game.id,
            sport: game.sport,
            home_team: game.homeTeam,
            away_team: game.awayTeam,
            opening_spread: game.openingSpread,
            current_home_score: game.homeScore ?? 0,
            current_away_score: game.awayScore ?? 0,
            status: game.status,
            commence_time: game.commenceTime.toISOString(),
            last_updated: new Date().toISOString(),
          }, { onConflict: 'external_id' })
        gamesUpdated++
      }
    }

    return NextResponse.json({ 
      message: "Sync complete",
      gamesUpdated,
      gamesCreated,
      provider: provider.name
    })
  } catch (error) {
    console.error("Error syncing odds:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to sync odds" 
    }, { status: 500 })
  }
}
