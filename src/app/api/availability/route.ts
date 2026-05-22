import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  const date = req.nextUrl.searchParams.get('date')

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('availability')
    .select('*')
    .gte('date_to', today)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (date) {
    // 特定日に空いてる人を検索: date_from <= date AND date_to >= date
    query = query.lte('date_from', date).gte('date_to', date)
  }

  const { data, error } = await query.order('date_from', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, date_from, date_to, note } = body

  const { data, error } = await supabase
    .from('availability')
    .insert({
      user_id,
      date_from,
      date_to,
      note: note || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
