"use client"

import { Bell, BellOff, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { toast } from "sonner"

export function NotificationToggle() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, permission } =
    usePushNotifications()

  // Check if VAPID keys are configured (push available)
  const pushAvailable = typeof window !== 'undefined' && isSupported

  // If push not supported, show email fallback indicator
  if (!pushAvailable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Mail className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Alerts will be sent to your email</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe()
        toast.success("Notifications disabled")
      } else {
        await subscribe()
        toast.success("Notifications enabled! You'll be alerted when spreads deviate.")
      }
    } catch (error) {
      if (permission === "denied") {
        toast.error("Please enable notifications in your browser settings")
      } else {
        toast.error("Failed to toggle notifications")
      }
      console.error(error)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={isLoading}
            className={isSubscribed ? "text-primary" : "text-muted-foreground hover:text-foreground"}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSubscribed ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isSubscribed
              ? "Disable spread alerts"
              : "Enable push notifications for spread alerts"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
