import { NextResponse } from "next/server"

export async function GET() {
  // Return the public VAPID key for push notification subscription
  // The private key is only used server-side for sending notifications
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID public key not configured" },
      { status: 500 }
    )
  }

  return NextResponse.json({ publicKey })
}
