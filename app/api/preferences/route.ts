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

  const { data: preferences, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching preferences:", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }

  // Return defaults if no preferences found
  if (!preferences) {
    return NextResponse.json({
      preferences: {
        deviation_threshold: 20,
        sports: ["nba", "nfl"],
        notifications_enabled: true,
      },
    })
  }

  return NextResponse.json({ preferences })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const updates = await request.json()

  // Validate the updates
  const allowedFields = ["deviation_threshold", "sports", "notifications_enabled", "push_subscription"]
  const filteredUpdates: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = value
    }
  }

  filteredUpdates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: user.id,
      ...filteredUpdates,
    }, {
      onConflict: "user_id",
    })
    .select()
    .single()

  if (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }

  return NextResponse.json({ preferences: data })
}
