'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Bell,
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { toast } from 'sonner'

interface AlertRule {
  id: string
  user_id: string
  name: string
  sport: 'nba' | 'nfl' | 'all'
  team: string | null
  deviation_threshold: number
  direction: 'favorite_losing' | 'underdog_winning' | 'any'
  is_active: boolean
  created_at: string
  updated_at: string
}

const TEAMS = {
  nba: [
    'Golden State Warriors', 'Los Angeles Lakers', 'Boston Celtics', 'Milwaukee Bucks',
    'Phoenix Suns', 'Denver Nuggets', 'Miami Heat', 'Philadelphia 76ers', 'Dallas Mavericks',
    'Cleveland Cavaliers', 'Brooklyn Nets', 'Memphis Grizzlies', 'Sacramento Kings',
  ],
  nfl: [
    'Kansas City Chiefs', 'Philadelphia Eagles', 'San Francisco 49ers', 'Buffalo Bills',
    'Dallas Cowboys', 'Miami Dolphins', 'Baltimore Ravens', 'Cincinnati Bengals',
    'Jacksonville Jaguars', 'Detroit Lions', 'Seattle Seahawks', 'Minnesota Vikings',
  ],
}

export default function AlertRulesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rules, setRules] = useState<AlertRule[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formName, setFormName] = useState('')
  const [formSport, setFormSport] = useState<'nba' | 'nfl' | 'all'>('all')
  const [formTeam, setFormTeam] = useState<string>('')
  const [formThreshold, setFormThreshold] = useState(20)
  const [formDirection, setFormDirection] = useState<'favorite_losing' | 'underdog_winning' | 'any'>('any')

  const loadRules = useCallback(async () => {
    const response = await fetch('/api/alert-rules')
    if (response.ok) {
      const data = await response.json()
      setRules(data.rules || [])
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadRules()
      }
      setIsLoading(false)
    }
    loadData()
  }, [loadRules])

  function openCreateDialog() {
    setEditingRule(null)
    setFormName('')
    setFormSport('all')
    setFormTeam('')
    setFormThreshold(20)
    setFormDirection('any')
    setIsDialogOpen(true)
  }

  function openEditDialog(rule: AlertRule) {
    setEditingRule(rule)
    setFormName(rule.name)
    setFormSport(rule.sport)
    setFormTeam(rule.team || '')
    setFormThreshold(rule.deviation_threshold)
    setFormDirection(rule.direction)
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error('Please enter a rule name')
      return
    }

    setIsSaving(true)

    const body = {
      name: formName,
      sport: formSport,
      team: formTeam || null,
      deviation_threshold: formThreshold,
      direction: formDirection,
    }

    try {
      if (editingRule) {
        const response = await fetch(`/api/alert-rules/${editingRule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!response.ok) throw new Error('Failed to update rule')
        toast.success('Rule updated')
      } else {
        const response = await fetch('/api/alert-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!response.ok) throw new Error('Failed to create rule')
        toast.success('Rule created')
      }
      
      await loadRules()
      setIsDialogOpen(false)
    } catch (error) {
      toast.error(editingRule ? 'Failed to update rule' : 'Failed to create rule')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleRule(rule: AlertRule) {
    const response = await fetch(`/api/alert-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    })
    
    if (response.ok) {
      await loadRules()
      toast.success(rule.is_active ? 'Rule disabled' : 'Rule enabled')
    } else {
      toast.error('Failed to update rule')
    }
  }

  async function deleteRule(ruleId: string) {
    const response = await fetch(`/api/alert-rules/${ruleId}`, {
      method: 'DELETE',
    })
    
    if (response.ok) {
      await loadRules()
      toast.success('Rule deleted')
    } else {
      toast.error('Failed to delete rule')
    }
  }

  function getDirectionLabel(direction: string) {
    switch (direction) {
      case 'favorite_losing': return 'Favorite Losing'
      case 'underdog_winning': return 'Underdog Winning'
      default: return 'Any Direction'
    }
  }

  function getDirectionIcon(direction: string) {
    switch (direction) {
      case 'favorite_losing': 
        return <TrendingDown className="w-5 h-5 text-destructive" />
      case 'underdog_winning': 
        return <TrendingUp className="w-5 h-5 text-primary" />
      default: 
        return <Zap className="w-5 h-5 text-amber-500" />
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Alert Rules</h1>
            <p className="text-muted-foreground">Create custom rules for spread deviation alerts</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        </div>

        {/* Default Rule */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Default Alert Rule
                </CardTitle>
                <CardDescription>Your global deviation threshold (configurable in Settings)</CardDescription>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-4">
                <Target className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">20+ Point Deviation</p>
                  <p className="text-sm text-muted-foreground">
                    Alert on all NBA and NFL games when score deviates 20+ points from spread
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/settings">Edit in Settings</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Rules */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Custom Rules</h2>
          
          {rules.length === 0 ? (
            <Empty
              icon={<Bell className="w-12 h-12" />}
              title="No custom rules yet"
              description="Create custom alert rules to catch specific betting scenarios"
            >
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rule
              </Button>
            </Empty>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rule.direction === 'favorite_losing' 
                        ? 'bg-destructive/10' 
                        : rule.direction === 'underdog_winning'
                        ? 'bg-primary/10'
                        : 'bg-amber-500/10'
                    }`}>
                      {getDirectionIcon(rule.direction)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{rule.name}</p>
                        <Badge variant="outline" className="text-xs uppercase">
                          {rule.sport}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {getDirectionLabel(rule.direction)} by {rule.deviation_threshold}+ pts
                        {rule.team ? ` • ${rule.team}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRule(rule)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}</DialogTitle>
              <DialogDescription>
                Define conditions for when you want to receive an alert
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Heavy Favorite Collapse"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sport</Label>
                  <Select value={formSport} onValueChange={(v) => setFormSport(v as typeof formSport)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sports</SelectItem>
                      <SelectItem value="nba">NBA</SelectItem>
                      <SelectItem value="nfl">NFL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select value={formDirection} onValueChange={(v) => setFormDirection(v as typeof formDirection)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Direction</SelectItem>
                      <SelectItem value="favorite_losing">Favorite Losing</SelectItem>
                      <SelectItem value="underdog_winning">Underdog Winning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specific Team (Optional)</Label>
                <Select value={formTeam} onValueChange={setFormTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any team</SelectItem>
                    {formSport !== 'nfl' && (
                      <>
                        <SelectItem value="" disabled className="font-semibold">NBA Teams</SelectItem>
                        {TEAMS.nba.map(team => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                      </>
                    )}
                    {formSport !== 'nba' && (
                      <>
                        <SelectItem value="" disabled className="font-semibold">NFL Teams</SelectItem>
                        {TEAMS.nfl.map(team => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Deviation Threshold (points)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={5}
                  max={50}
                  value={formThreshold}
                  onChange={e => setFormThreshold(parseInt(e.target.value) || 20)}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when score deviates by this many points or more from the opening spread
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner className="w-4 h-4 mr-2" /> : null}
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
