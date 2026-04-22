import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  
  if (body.name !== undefined) updateData.name = body.name
  if (body.sport !== undefined) updateData.sport = body.sport
  if (body.team !== undefined) updateData.team = body.team
  if (body.deviation_threshold !== undefined) updateData.deviation_threshold = body.deviation_threshold
  if (body.direction !== undefined) updateData.direction = body.direction
  if (body.is_active !== undefined) updateData.is_active = body.is_active

  const { data: rule, error } = await supabase
    .from('alert_rules')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
  }

  return NextResponse.json({ rule })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('alert_rules')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
