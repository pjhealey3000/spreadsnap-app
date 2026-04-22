import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { sendNotification } from "@/lib/notifications"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface Game {
  id: string
  sport: string
  home_team: string
  away_team: string
  opening_spread: number | null
  current_home_score: number
  current_away_score: number
  status: string
}

function calculateDeviation(game: Game): { 
  deviation: number
  favoriteTeam: string
  isFavoriteLosing: boolean
  message: string 
} | null {
  if (game.opening_spread === null) return null

  const scoreDiff = game.current_home_score - game.current_away_score
  const expectedDiff = -game.opening_spread
  const deviation = expectedDiff - scoreDiff

  const homeFavored = game.opening_spread < 0
  const favoriteTeam = homeFavored ? game.home_team : game.away_team
  const isFavoriteLosing = (homeFavored && scoreDiff < 0) || (!homeFavored && scoreDiff > 0)

  if (Math.abs(deviation) < 5) return null

  const message = isFavoriteLosing
    ? `${favoriteTeam} was ${Math.abs(game.opening_spread).toFixed(1)}-point favorite but now trails by ${Math.abs(scoreDiff)}. Deviation: ${Math.abs(deviation).toFixed(1)} pts.`
    : `Deviation: ${Math.abs(deviation).toFixed(1)} pts from opening spread.`

  return { deviation: Math.abs(deviation), favoriteTeam, isFavoriteLosing, message }
}

/**
 * Manual alert check endpoint for Hobby tier deployment.
 * Checks current games for deviations and sends alerts.
 * Requires authenticated user session.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 })
  }

  const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get live games
    const { data: liveGames, error: gamesError } = await serviceClient
      .from("games")
      .select("*")
      .eq("status", "live")

    if (gamesError) throw gamesError

    if (!liveGames || liveGames.length === 0) {
      return NextResponse.json({ message: "No live games", alertsTriggered: 0 })
    }

    // Get user preferences
    const { data: prefs } = await serviceClient
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const threshold = prefs?.deviation_threshold ?? 20
    const sports = prefs?.sports ?? ['nba', 'nfl']

    // Get recent alerts to avoid duplicates
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await serviceClient
      .from("alerts")
      .select("game_id")
      .eq("user_id", user.id)
      .gte("sent_at", oneHourAgo)

    const recentGameIds = new Set((recentAlerts || []).map(a => a.game_id))

    let alertsTriggered = 0
    const alertDetails: { game: string; deviation: number }[] = []

    for (const game of liveGames as Game[]) {
      if (recentGameIds.has(game.id)) continue
      if (!sports.includes(game.sport)) continue

      const deviationResult = calculateDeviation(game)
      if (!deviationResult) continue
      if (deviationResult.deviation < threshold) continue
      if (!deviationResult.isFavoriteLosing) continue

      // Try to send notification
      const sent = await sendNotification({
        userId: user.id,
        title: `${game.sport.toUpperCase()} Alert: ${deviationResult.favoriteTeam}`,
        body: deviationResult.message,
        url: "/dashboard",
        pushSubscription: prefs?.push_subscription,
        email: prefs?.email,
      })

      if (sent) {
        await serviceClient.from("alerts").insert({
          user_id: user.id,
          game_id: game.id,
          deviation_amount: deviationResult.deviation,
          message: deviationResult.message,
        })
        alertsTriggered++
        alertDetails.push({
          game: `${game.away_team} @ ${game.home_team}`,
          deviation: deviationResult.deviation
        })
      }
    }

    return NextResponse.json({ 
      message: alertsTriggered > 0 ? "Alerts sent" : "No new alerts",
      gamesChecked: liveGames.length,
      alertsTriggered,
      alerts: alertDetails
    })
  } catch (error) {
    console.error("Error running alerts:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to run alert check" 
    }, { status: 500 })
  }
}
