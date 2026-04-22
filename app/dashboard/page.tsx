import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch user preferences
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  // Fetch games (live and upcoming)
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .in('status', ['live', 'scheduled'])
    .order('status', { ascending: false })
    .order('commence_time', { ascending: true })

  // Fetch user's watchlist
  const { data: watchlist } = await supabase
    .from('user_watchlist')
    .select('game_id')
    .eq('user_id', user!.id)

  // Fetch recent alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', user!.id)
    .order('sent_at', { ascending: false })
    .limit(50)

  return (
    <DashboardClient
      user={user!}
      initialPreferences={preferences}
      initialGames={games || []}
      initialWatchlist={watchlist?.map(w => w.game_id) || []}
      initialAlerts={alerts || []}
    />
  )
}
