import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: alerts, error } = await supabase
    .from("alerts")
    .select(`
      *,
      games (
        id,
        sport,
        home_team,
        away_team,
        current_home_score,
        current_away_score,
        opening_spread
      )
    `)
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }

  return NextResponse.json({ alerts })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { alertId, acknowledged } = await request.json()

  if (!alertId) {
    return NextResponse.json({ error: "Alert ID is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("alerts")
    .update({ acknowledged })
    .eq("id", alertId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating alert:", error)
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
