import webpush from 'web-push'

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@spreadsnap.app'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export interface NotificationPayload {
  userId: string
  title: string
  body: string
  url?: string
  pushSubscription?: PushSubscriptionJSON | null
  email?: string | null
}

interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Check if push notifications are properly configured
 */
export function canSendPushNotifications(): boolean {
  return Boolean(vapidPublicKey && vapidPrivateKey)
}

/**
 * Send a notification to a user via push notification or email fallback
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const { title, body, url, pushSubscription } = payload

  // Try push notification first
  if (pushSubscription && canSendPushNotifications()) {
    try {
      await webpush.sendNotification(
        {
          endpoint: pushSubscription.endpoint,
          keys: pushSubscription.keys,
        },
        JSON.stringify({
          title,
          body,
          url: url || '/dashboard',
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
        })
      )
      return true
    } catch (error) {
      console.error('Push notification failed:', error)
      // Fall through to try email
    }
  }

  // Email fallback would go here
  // For now, just log that we would send an email
  if (payload.email) {
    console.log(`Would send email to ${payload.email}: ${title} - ${body}`)
    // In production, integrate with an email service like Resend or SendGrid
    return true
  }

  return false
}

/**
 * Generate VAPID keys for push notifications
 * Run this once to generate keys: npx ts-node -e "console.log(require('web-push').generateVAPIDKeys())"
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys()
}
