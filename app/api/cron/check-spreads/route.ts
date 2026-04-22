import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createOddsProvider } from "@/lib/odds-providers"
import { sendNotification, canSendPushNotifications } from "@/lib/notifications"

// Use service role for cron job to bypass RLS
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

interface UserPreference {
  user_id: string
  deviation_threshold: number
  sports: string[]
  push_subscription: object | null
  email: string | null
  notifications_enabled: boolean
}

interface AlertRule {
  id: string
  user_id: string
  name: string
  sport: 'nba' | 'nfl' | 'all'
  team: string | null
  deviation_threshold: number
  direction: 'favorite_losing' | 'underdog_winning' | 'any'
  is_active: boolean
}

interface ExistingAlert {
  user_id: string
  game_id: string
}

/**
 * Calculate the current deviation from the opening spread
 */
function calculateDeviation(game: Game): { 
  deviation: number
  favoriteTeam: string
  underdogTeam: string
  isFavoriteLosing: boolean
  message: string 
} | null {
  if (game.opening_spread === null) return null

  const scoreDiff = game.current_home_score - game.current_away_score
  const expectedDiff = -game.opening_spread

  const deviation = expectedDiff - scoreDiff

  const homeFavored = game.opening_spread < 0
  const favoriteTeam = homeFavored ? game.home_team : game.away_team
  const underdogTeam = homeFavored ? game.away_team : game.home_team

  // Determine if favorite is losing
  const isFavoriteLosing = (homeFavored && scoreDiff < 0) || (!homeFavored && scoreDiff > 0)

  if (Math.abs(deviation) < 5) return null

  const message = isFavoriteLosing
    ? `${favoriteTeam} was ${Math.abs(game.opening_spread).toFixed(1)}-point favorite but now trails by ${Math.abs(scoreDiff)}. Deviation: ${Math.abs(deviation).toFixed(1)} pts.`
    : `${underdogTeam} is keeping it close against favored ${favoriteTeam}. Deviation: ${Math.abs(deviation).toFixed(1)} pts.`

  return { deviation: Math.abs(deviation), favoriteTeam, underdogTeam, isFavoriteLosing, message }
}

/**
 * Check if a game matches an alert rule
 */
function matchesRule(game: Game, rule: AlertRule, deviationResult: ReturnType<typeof calculateDeviation>): boolean {
  if (!deviationResult) return false

  // Check sport
  if (rule.sport !== 'all' && game.sport !== rule.sport) return false

  // Check team
  if (rule.team && rule.team !== game.home_team && rule.team !== game.away_team) return false

  // Check deviation threshold
  if (deviationResult.deviation < rule.deviation_threshold) return false

  // Check direction
  if (rule.direction === 'favorite_losing' && !deviationResult.isFavoriteLosing) return false
  if (rule.direction === 'underdog_winning' && deviationResult.isFavoriteLosing) return false

  return true
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const provider = createOddsProvider()

  try {
    // Optionally sync live data from provider (if API key is set)
    if (process.env.ODDS_API_KEY) {
      for (const sport of ['nba', 'nfl'] as const) {
        const liveGames = await provider.getLiveScores(sport)
        
        for (const game of liveGames) {
          await supabase
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
        }
      }
    }

    // Get all live games
    const { data: liveGames, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .eq("status", "live")

    if (gamesError) throw gamesError

    if (!liveGames || liveGames.length === 0) {
      return NextResponse.json({ message: "No live games", alerts: 0, snapshots: 0 })
    }

    // Capture odds snapshots for historical data
    let snapshotsCaptured = 0
    for (const game of liveGames as Game[]) {
      const deviationResult = calculateDeviation(game)
      
      if (deviationResult && deviationResult.deviation >= 10) {
        await supabase.from("odds_snapshots").insert({
          game_id: game.id,
          home_score: game.current_home_score,
          away_score: game.current_away_score,
          deviation: deviationResult.isFavoriteLosing ? deviationResult.deviation : -deviationResult.deviation,
        })
        snapshotsCaptured++
      }
    }

    // Get all users with notifications enabled (push or email)
    const { data: users, error: usersError } = await supabase
      .from("user_preferences")
      .select("user_id, deviation_threshold, sports, push_subscription, email, notifications_enabled")
      .eq("notifications_enabled", true)

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: "No users with notifications enabled", 
        alerts: 0,
        snapshots: snapshotsCaptured 
      })
    }

    // Get all active custom alert rules
    const { data: alertRules } = await supabase
      .from("alert_rules")
      .select("*")
      .eq("is_active", true)

    // Get recent alerts to avoid duplicates
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await supabase
      .from("alerts")
      .select("user_id, game_id")
      .gte("sent_at", oneHourAgo)

    const recentAlertKeys = new Set(
      (recentAlerts || []).map((a: ExistingAlert) => `${a.user_id}-${a.game_id}`)
    )

    let alertsSent = 0

    // Check each game for deviations
    for (const game of liveGames as Game[]) {
      const deviationResult = calculateDeviation(game)
      if (!deviationResult) continue

      // Send alerts to users who should be notified
      for (const user of users as UserPreference[]) {
        // Skip if already alerted for this game
        if (recentAlertKeys.has(`${user.user_id}-${game.id}`)) continue

        // Check default threshold first
        let shouldAlert = false
        let alertMessage = deviationResult.message

        if (
          deviationResult.deviation >= user.deviation_threshold &&
          user.sports.includes(game.sport) &&
          deviationResult.isFavoriteLosing
        ) {
          shouldAlert = true
        }

        // Check custom rules for this user
        const userRules = (alertRules || []).filter((r: AlertRule) => r.user_id === user.user_id)
        for (const rule of userRules as AlertRule[]) {
          if (matchesRule(game, rule, deviationResult)) {
            shouldAlert = true
            alertMessage = `[${rule.name}] ${deviationResult.message}`
            break
          }
        }

        if (!shouldAlert) continue

        // Skip if user has no way to receive notifications
        if (!user.push_subscription && !user.email) continue

        // Send notification (push with email fallback)
        try {
          const sent = await sendNotification({
            userId: user.user_id,
            title: `${game.sport.toUpperCase()} Alert: ${deviationResult.favoriteTeam}`,
            body: alertMessage,
            url: "/dashboard",
            pushSubscription: user.push_subscription,
            email: user.email,
          })

          if (sent) {
            await supabase.from("alerts").insert({
              user_id: user.user_id,
              game_id: game.id,
              deviation_amount: deviationResult.deviation,
              message: alertMessage,
            })

            alertsSent++
          }
        } catch (notifyError) {
          console.error(`Failed to notify user ${user.user_id}:`, notifyError)
        }
      }
    }

    return NextResponse.json({ 
      message: "Spread check complete", 
      gamesChecked: liveGames.length,
      snapshotsCaptured,
      alertsSent 
    })
  } catch (error) {
    console.error("Error in spread check cron:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
