import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  const date = req.nextUrl.searchParams.get('date')
  const includeUser = req.nextUrl.searchParams.get('include_user')

  const today = new Date().toISOString().split('T')[0]

  const selectFields = includeUser === 'true'
    ? '*, user:users!user_id(id, skills, areas)'
    : '*'

  let query = supabase
    .from('availability')
    .select(selectFields)
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

  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', 'private, no-cache, no-store')
  return response
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

  // deleteはcount付きで実行し、実際に削除されたか確認
  const { data, error, count } = await supabase
    .from('availability')
    .delete({ count: 'exact' })
    .eq('id', Number(id) || id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 何も削除されなかった場合（id型不一致の可能性）
  if (!data || data.length === 0) {
    // 文字列型でリトライ
    const { data: data2, error: error2 } = await supabase
      .from('availability')
      .delete({ count: 'exact' })
      .eq('id', String(id))
      .select()

    if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
    if (!data2 || data2.length === 0) {
      return NextResponse.json({ error: 'レコードが見つかりませんでした', id }, { status: 404 })
    }
  }

  return NextResponse.json({ success: true })
}
