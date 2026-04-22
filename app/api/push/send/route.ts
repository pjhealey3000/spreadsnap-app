import { NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@/lib/supabase/server"

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:alerts@spreadsnap.app",
    vapidPublicKey,
    vapidPrivateKey
  )
}

interface PushPayload {
  title: string
  body: string
  url?: string
  gameId?: string
}

export async function POST(request: Request) {
  // This endpoint should only be called by the cron job or admin
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "Push notifications not configured" },
      { status: 500 }
    )
  }

  try {
    const { userId, payload }: { userId: string; payload: PushPayload } = await request.json()

    const supabase = await createClient()

    // Get user's push subscription
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("push_subscription, notifications_enabled")
      .eq("user_id", userId)
      .single()

    if (error || !preferences?.push_subscription || !preferences.notifications_enabled) {
      return NextResponse.json({ error: "User has no active subscription" }, { status: 404 })
    }

    // Send the push notification
    await webpush.sendNotification(
      preferences.push_subscription,
      JSON.stringify(payload)
    )

    // Record the alert in the database
    if (payload.gameId) {
      await supabase.from("alerts").insert({
        user_id: userId,
        game_id: payload.gameId,
        deviation_amount: 0, // Will be set by caller
        message: payload.body,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending push notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
