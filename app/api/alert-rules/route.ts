import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rules })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  
  const { name, sport, team, deviation_threshold, direction } = body

  if (!name || !sport) {
    return NextResponse.json({ error: 'Name and sport are required' }, { status: 400 })
  }

  const { data: rule, error } = await supabase
    .from('alert_rules')
    .insert({
      user_id: user.id,
      name,
      sport,
      team: team || null,
      deviation_threshold: deviation_threshold || 20,
      direction: direction || 'any',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rule }, { status: 201 })
}
