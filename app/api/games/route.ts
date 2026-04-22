"use server"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") // 'nba', 'nfl', or null for all
  const status = searchParams.get("status") // 'live', 'scheduled', 'final', or null for all

  const supabase = await createClient()

  let query = supabase
    .from("games")
    .select("*")
    .order("status", { ascending: true }) // live games first
    .order("commence_time", { ascending: true })

  if (sport) {
    query = query.eq("sport", sport)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data: games, error } = await query

  if (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
  }

  return NextResponse.json({ games })
}
