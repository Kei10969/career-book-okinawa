import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendLinePush } from '@/lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { status } = body

  if (!status || !['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status. Must be accepted or rejected.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_approaches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 両企業のプロフィールを取得
  const [fromProfileRes, toProfileRes, fromUserRes, toUserRes] = await Promise.all([
    supabase.from('business_profiles').select('*').eq('user_id', data.from_business_id).single(),
    supabase.from('business_profiles').select('*').eq('user_id', data.to_business_id).single(),
    supabase.from('users').select('line_id').eq('id', data.from_business_id).single(),
    supabase.from('users').select('line_id').eq('id', data.to_business_id).single(),
  ])

  const fromProfile = fromProfileRes.data
  const toProfile = toProfileRes.data
  const fromUser = fromUserRes.data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://career-book-okinawa-seven.vercel.app'

  if (status === 'accepted') {
    const toName = toProfile?.company_name || '企業'
    const toPhone = toProfile?.phone || '未登録'
    const fromName = fromProfile?.company_name || '企業'
    const fromPhone = fromProfile?.phone || '未登録'

    // アプローチ元企業に「成立」通知（連絡先付き）
    await supabase.from('notifications').insert({
      user_id: data.from_business_id,
      type: 'application_approved',
      title: `✅ ${toName}とのマッチングが成立しました！`,
      message: `連絡先: ${toPhone}`,
      link: `/b/company/${data.to_business_id}`,
      profile_link: `/b/company/${data.to_business_id}`,
      role: 'business',
      is_read: false,
    })

    // アプローチ先企業に「成立」通知
    await supabase.from('notifications').insert({
      user_id: data.to_business_id,
      type: 'application_approved',
      title: `✅ ${fromName}とのマッチングが成立しました！`,
      message: `連絡先: ${fromPhone}`,
      link: `/b/company/${data.from_business_id}`,
      profile_link: `/b/company/${data.from_business_id}`,
      role: 'business',
      is_read: false,
    })

    // LINE通知（アプローチ元）
    if (fromUser?.line_id) {
      await sendLinePush(
        fromUser.line_id,
        `✅ ${toName}とのマッチングが成立しました！\n連絡先: ${toPhone}\n\n▼ 企業プロフィールを見る\n${appUrl}/b/company/${data.to_business_id}`
      )
    }

    // レスポンスに相手の連絡先を含める
    return NextResponse.json({
      ...data,
      contact: {
        company_name: fromProfile?.company_name || null,
        phone: fromProfile?.phone || null,
        contact_name: fromProfile?.contact_name || null,
      },
    })
  } else {
    // rejected（不成立）
    const toName = toProfile?.company_name || '企業'

    // アプローチ元企業に「不成立」通知
    await supabase.from('notifications').insert({
      user_id: data.from_business_id,
      type: 'application_rejected',
      title: '📋 アプローチ結果のお知らせ',
      message: `${toName}へのアプローチは今回見送りとなりました。`,
      link: '/b/home',
      profile_link: null,
      role: 'business',
      is_read: false,
    })

    // LINE通知（アプローチ元）
    if (fromUser?.line_id) {
      await sendLinePush(
        fromUser.line_id,
        `📋 アプローチ結果\n${toName}へのアプローチは今回見送りとなりました。\n\n▼ 他の企業を探す\n${appUrl}/b/home`
      )
    }

    return NextResponse.json(data)
  }
}
