import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendLinePush } from '@/lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const fromUserId = req.nextUrl.searchParams.get('from_user_id')

  let query = supabase
    .from('offers')
    .select('*, user:users!from_user_id(display_name, avatar_url)')
    .order('created_at', { ascending: false })

  if (fromUserId) query = query.eq('from_user_id', fromUserId)

  const { data, error } = await query
  if (error) {
    // offersテーブルが未作成の場合は空配列を返す
    console.error('offers GET error:', error.message)
    return NextResponse.json([])
  }
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('offers').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 企業ユーザーに新着オファー通知を送る
  if (data) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://career-book-okinawa-seven.vercel.app'

    // 全企業ユーザーを取得（投稿者自身は除外）
    const { data: businessUsers } = await supabase
      .from('users')
      .select('id, line_id')
      .eq('type', 'company')
      .neq('id', body.from_user_id)

    if (businessUsers && businessUsers.length > 0) {
      // アプリ内通知を一括作成
      const notifications = businessUsers.map((user) => ({
        user_id: user.id,
        type: 'new_offer' as const,
        title: '💼 新しいオファーが投稿されました！',
        message: `${data.trade}（${data.area}）の職人がオファーを投稿しました。`,
        link: `/b/offers/${data.id}`,
        profile_link: `/b/offers/${data.id}`,
        role: 'business',
        is_read: false,
      }))

      await supabase.from('notifications').insert(notifications)

      // LINE通知を送信（line_idがあるユーザーのみ）
      for (const user of businessUsers) {
        if (user.line_id) {
          await sendLinePush(
            user.line_id,
            `💼 新しいオファーが投稿されました！\n\n${data.trade}（${data.area}）\n\n▼ オファーを確認する\n${appUrl}/b/offers/${data.id}`
          )
        }
      }
    }
  }

  return NextResponse.json(data)
}
