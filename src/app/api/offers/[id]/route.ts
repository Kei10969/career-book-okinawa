import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: offer, error } = await supabase
    .from('offers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  // 投稿者の匿名プロフィールを取得（display_name, phone, emailは返さない）
  const { data: user } = await supabase
    .from('users')
    .select('id, skills, areas, qualifications, experience_years, desired_salary, job_status, bio')
    .eq('id', offer.from_user_id)
    .single()

  return NextResponse.json({ ...offer, worker_profile: user || null })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fromUserId = req.nextUrl.searchParams.get('from_user_id')

  let query = supabase.from('offers').delete().eq('id', id)
  if (fromUserId) query = query.eq('from_user_id', fromUserId)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
