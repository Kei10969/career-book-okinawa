import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  const area = req.nextUrl.searchParams.get('area')
  const userId = req.nextUrl.searchParams.get('user_id')

  let query = supabase
    .from('requests')
    .select('*, user:users(display_name, company_name, type)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (type && type !== 'all') query = query.eq('type', type)
  if (area && area !== 'all') query = query.eq('area', area)
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('requests').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
