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

  const { data: watchlist, error } = await supabase
    .from("user_watchlist")
    .select("game_id")
    .eq("user_id", user.id)

  if (error) {
    console.error("Error fetching watchlist:", error)
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 })
  }

  return NextResponse.json({ watchlist: watchlist.map((w) => w.game_id) })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { gameId } = await request.json()

  if (!gameId) {
    return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
  }

  const { error } = await supabase.from("user_watchlist").insert({
    user_id: user.id,
    game_id: gameId,
  })

  if (error) {
    if (error.code === "23505") {
      // Duplicate entry
      return NextResponse.json({ message: "Already watching" }, { status: 200 })
    }
    console.error("Error adding to watchlist:", error)
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { gameId } = await request.json()

  if (!gameId) {
    return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("user_watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("game_id", gameId)

  if (error) {
    console.error("Error removing from watchlist:", error)
    return NextResponse.json({ error: "Failed to remove from watchlist" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
