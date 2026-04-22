'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Bell, BellOff } from 'lucide-react'
import { UserPreferences, Sport } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preferences: UserPreferences | null
  onPreferencesUpdate: (prefs: Partial<UserPreferences>) => void
}

export function SettingsDialog({ open, onOpenChange, preferences, onPreferencesUpdate }: SettingsDialogProps) {
  const [threshold, setThreshold] = useState(preferences?.deviation_threshold ?? 20)
  const [sports, setSports] = useState<Sport[]>(preferences?.sports ?? ['nba', 'nfl'])
  const [notificationsEnabled, setNotificationsEnabled] = useState(preferences?.notifications_enabled ?? true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRequestingPush, setIsRequestingPush] = useState(false)
  const [pushStatus, setPushStatus] = useState<'unsupported' | 'denied' | 'granted' | 'default'>('default')

  // Check push notification status on mount
  useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission)
    } else {
      setPushStatus('unsupported')
    }
  })

  const toggleSport = (sport: Sport) => {
    if (sports.includes(sport)) {
      if (sports.length > 1) {
        setSports(sports.filter(s => s !== sport))
      }
    } else {
      setSports([...sports, sport])
    }
  }

  async function requestPushPermission() {
    if (!('Notification' in window)) {
      setPushStatus('unsupported')
      return
    }

    setIsRequestingPush(true)
    try {
      const permission = await Notification.requestPermission()
      setPushStatus(permission)
      
      if (permission === 'granted') {
        // Register service worker and get push subscription
        // This would be implemented with web-push in production
        console.log('Push notifications enabled')
      }
    } catch {
      console.error('Failed to request push permission')
    }
    setIsRequestingPush(false)
  }

  async function handleSave() {
    if (!preferences) return
    setIsSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('user_preferences')
      .update({
        deviation_threshold: threshold,
        sports,
        notifications_enabled: notificationsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', preferences.user_id)

    if (!error) {
      onPreferencesUpdate({
        deviation_threshold: threshold,
        sports,
        notifications_enabled: notificationsEnabled,
      })
      onOpenChange(false)
    }

    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your alert preferences and notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Deviation Threshold */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Deviation Threshold</FieldLabel>
              <span className="text-sm font-medium text-primary">{threshold} pts</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Alert when score deviates this much from opening spread
            </p>
            <Slider
              value={[threshold]}
              onValueChange={([value]) => setThreshold(value)}
              min={5}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5 pts</span>
              <span>30 pts</span>
            </div>
          </Field>

          {/* Sports Selection */}
          <Field>
            <FieldLabel>Sports to Track</FieldLabel>
            <p className="text-xs text-muted-foreground mb-3">
              Select which sports you want to receive alerts for
            </p>
            <div className="flex gap-2">
              <Badge
                variant={sports.includes('nba') ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => toggleSport('nba')}
              >
                NBA
              </Badge>
              <Badge
                variant={sports.includes('nfl') ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => toggleSport('nfl')}
              >
                NFL
              </Badge>
            </div>
          </Field>

          {/* Push Notifications */}
          <Field>
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel>Push Notifications</FieldLabel>
                <p className="text-xs text-muted-foreground">
                  Get browser alerts for significant deviations
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            {notificationsEnabled && pushStatus !== 'granted' && (
              <div className="mt-3">
                {pushStatus === 'unsupported' ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <BellOff className="w-3 h-3" />
                    Push notifications not supported in this browser
                  </p>
                ) : pushStatus === 'denied' ? (
                  <p className="text-xs text-destructive flex items-center gap-2">
                    <BellOff className="w-3 h-3" />
                    Notifications blocked. Enable in browser settings.
                  </p>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={requestPushPermission}
                    disabled={isRequestingPush}
                  >
                    {isRequestingPush ? <Spinner className="mr-2" /> : <Bell className="w-3 h-3 mr-2" />}
                    Enable Browser Notifications
                  </Button>
                )}
              </div>
            )}
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Spinner className="mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
