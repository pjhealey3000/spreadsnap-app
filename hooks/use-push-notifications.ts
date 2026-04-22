"use client"

import { useState, useEffect, useCallback } from "react"

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)

      // Check for existing subscription
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub)
        })
      })
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Push notifications are not supported in this browser")
    }

    setIsLoading(true)

    try {
      // Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== "granted") {
        throw new Error("Notification permission denied")
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      // Get VAPID public key from server
      const vapidResponse = await fetch("/api/push/vapid-key")
      const { publicKey } = await vapidResponse.json()

      if (!publicKey) {
        throw new Error("VAPID public key not configured")
      }

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      setSubscription(sub)

      // Save subscription to server
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          push_subscription: sub.toJSON(),
          notifications_enabled: true,
        }),
      })

      return sub
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return

    setIsLoading(true)

    try {
      await subscription.unsubscribe()
      setSubscription(null)

      // Remove subscription from server
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          push_subscription: null,
          notifications_enabled: false,
        }),
      })
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
