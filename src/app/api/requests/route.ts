import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendLinePush } from '@/lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  const area = req.nextUrl.searchParams.get('area')
  const trade = req.nextUrl.searchParams.get('trade')
  const userId = req.nextUrl.searchParams.get('user_id')

  let query = supabase
    .from('requests')
    .select('*, user:users(display_name, company_name, type)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (type && type !== 'all') query = query.eq('type', type)
  if (area && area !== 'all') query = query.eq('area', area)
  if (trade && trade !== 'all') query = query.eq('trade', trade)
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const response = NextResponse.json(data)
  // user_id指定（マイページ）の場合はキャッシュしない
  if (userId) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store')
  } else {
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30')
  }
  return response
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('requests').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 企業が募集投稿した時 → 投稿者以外の全企業ユーザーにLINE通知
  if (data?.user_id) {
    const typeLabel = data.type === 'support' ? '応援' : data.type === 'subcontract' ? '下請け' : '募集'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://career-book-okinawa-seven.vercel.app'

    // 投稿者の企業名を取得
    const { data: poster } = await supabase
      .from('users')
      .select('display_name, company_name')
      .eq('id', data.user_id)
      .single()
    const posterName = poster?.company_name || poster?.display_name || '企業'

    // 投稿者以外の全企業ユーザーを取得
    const { data: businessUsers } = await supabase
      .from('users')
      .select('id, line_id')
      .eq('type', 'company')
      .neq('id', data.user_id)

    if (businessUsers && businessUsers.length > 0) {
      const notificationInserts = businessUsers.map(user => ({
        user_id: user.id,
        type: 'new_request',
        title: `📢 新しい${typeLabel}募集が投稿されました`,
        message: `${posterName}が「${data.title}」を投稿しました。`,
        link: `/b/requests/${data.id}`,
        related_id: data.user_id,
        role: 'business',
        is_read: false,
      }))

      // アプリ内通知を一括挿入
      await supabase.from('notifications').insert(notificationInserts)

      // LINE プッシュ通知（line_idがあるユーザーのみ）
      const lineTargets = businessUsers.filter(u => u.line_id)
      await Promise.all(
        lineTargets.map(user =>
          sendLinePush(
            user.line_id!,
            `📢 新しい${typeLabel}募集が投稿されました\n\n${posterName}が「${data.title}」を投稿しました。\n\n▼ 詳細を見る\n${appUrl}/b/requests/${data.id}`
          )
        )
      )
    }
  }

  return NextResponse.json(data)
}
