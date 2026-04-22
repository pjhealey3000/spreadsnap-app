'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { 
  Bell, 
  BellOff, 
  CreditCard, 
  Settings, 
  Check,
  Zap,
  Crown,
  User as UserIcon,
} from 'lucide-react'
import { UserPreferences, Sport } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'

// Mock pricing plans
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with basic alerts',
    features: [
      '2 sports (NBA, NFL)',
      '20+ point deviation alerts',
      'Browser notifications',
      'Basic dashboard',
    ],
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For serious bettors',
    features: [
      'All sports (NBA, NFL, MLB, NHL)',
      'Custom deviation thresholds',
      'SMS + Email alerts',
      'Historical data access',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    period: '/month',
    description: 'For betting groups',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Shared watchlists',
      'API access',
      'Dedicated support',
    ],
  },
]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'preferences'
  
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [threshold, setThreshold] = useState(20)
  const [sports, setSports] = useState<Sport[]>(['nba', 'nfl'])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [pushStatus, setPushStatus] = useState<'unsupported' | 'denied' | 'granted' | 'default'>('default')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUser(user)

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (prefs) {
        setPreferences(prefs)
        setThreshold(prefs.deviation_threshold)
        setSports(prefs.sports)
        setNotificationsEnabled(prefs.notifications_enabled)
      }

      if ('Notification' in window) {
        setPushStatus(Notification.permission)
      } else {
        setPushStatus('unsupported')
      }

      setIsLoading(false)
    }

    loadData()
  }, [])

  const toggleSport = (sport: Sport) => {
    if (sports.includes(sport)) {
      if (sports.length > 1) {
        setSports(sports.filter(s => s !== sport))
      }
    } else {
      setSports([...sports, sport])
    }
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

    if (error) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Settings saved successfully')
      setPreferences({
        ...preferences,
        deviation_threshold: threshold,
        sports,
        notifications_enabled: notificationsEnabled,
      })
    }

    setIsSaving(false)
  }

  async function requestPushPermission() {
    if (!('Notification' in window)) {
      setPushStatus('unsupported')
      return
    }

    const permission = await Notification.requestPermission()
    setPushStatus(permission)
    
    if (permission === 'granted') {
      toast.success('Push notifications enabled')
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <AppShell user={user}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>Configure when and how you receive deviation alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel>Deviation Threshold</FieldLabel>
                    <span className="text-sm font-medium text-primary">{threshold} pts</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Alert when live score deviates this much from opening spread
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
                    <span>5 pts (more alerts)</span>
                    <span>30 pts (fewer alerts)</span>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Sports to Track</FieldLabel>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select which sports you want to receive alerts for
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={sports.includes('nba') ? 'default' : 'outline'}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => toggleSport('nba')}
                    >
                      NBA Basketball
                    </Badge>
                    <Badge
                      variant={sports.includes('nfl') ? 'default' : 'outline'}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => toggleSport('nfl')}
                    >
                      NFL Football
                    </Badge>
                    <Badge
                      variant="outline"
                      className="px-4 py-2 text-sm opacity-50 cursor-not-allowed"
                    >
                      MLB (Pro)
                    </Badge>
                    <Badge
                      variant="outline"
                      className="px-4 py-2 text-sm opacity-50 cursor-not-allowed"
                    >
                      NHL (Pro)
                    </Badge>
                  </div>
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>How you want to be alerted</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get browser alerts for significant deviations
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>

                {notificationsEnabled && pushStatus !== 'granted' && (
                  <div className="p-4 rounded-lg bg-secondary/50">
                    {pushStatus === 'unsupported' ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <BellOff className="w-4 h-4" />
                        Push notifications are not supported in this browser
                      </p>
                    ) : pushStatus === 'denied' ? (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <BellOff className="w-4 h-4" />
                        Notifications blocked. Enable in browser settings.
                      </p>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Enable browser notifications to get real-time alerts
                        </p>
                        <Button variant="outline" size="sm" onClick={requestPushPermission}>
                          <Bell className="w-4 h-4 mr-2" />
                          Enable
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get email alerts (Pro feature)
                    </p>
                  </div>
                  <Badge variant="outline">Pro</Badge>
                </div>

                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get text message alerts (Pro feature)
                    </p>
                  </div>
                  <Badge variant="outline">Pro</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Spinner className="mr-2" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>You are currently on the Free plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Free Plan</p>
                    <p className="text-sm text-muted-foreground">Basic features with 20+ point thresholds</p>
                  </div>
                  <Badge>Current</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              {plans.map(plan => (
                <Card 
                  key={plan.id} 
                  className={plan.highlighted ? 'border-primary shadow-lg relative' : ''}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {plan.current && <Badge variant="outline">Current</Badge>}
                    </CardTitle>
                    <div>
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map(feature => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.current ? 'outline' : plan.highlighted ? 'default' : 'outline'}
                      disabled={plan.current}
                    >
                      {plan.current ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Email Address</FieldLabel>
                    <Input value={user.email ?? ''} disabled />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to change your email
                    </p>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
