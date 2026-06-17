import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // リクエスト本体を取得
  const { data, error } = await supabase
    .from('requests')
    .select('*, user:users(display_name, company_name, type)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 応募数を取得
  const { count } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', id)

  return NextResponse.json({ ...data, _count: { applications: count || 0 } })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabase
    .from('requests')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = req.nextUrl.searchParams.get('user_id')

  // 関連する応募IDを取得
  const { data: apps } = await supabase
    .from('applications')
    .select('id')
    .eq('request_id', id)

  if (apps && apps.length > 0) {
    const appIds = apps.map(a => a.id)

    // cancellations → reviews → applications の順に削除（外部キー制約対応）
    await supabase.from('cancellations').delete().in('application_id', appIds)
    await supabase.from('reviews').delete().in('application_id', appIds)
    await supabase.from('applications').delete().eq('request_id', id)
  }

  // 関連する通知も削除（linkにrequest_idが含まれるもの）
  await supabase.from('notifications').delete().like('link', `%${id}%`)

  let query = supabase.from('requests').delete().eq('id', id)
  if (userId) query = query.eq('user_id', userId)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
