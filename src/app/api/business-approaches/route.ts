import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendLinePush } from '@/lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const fromId = req.nextUrl.searchParams.get('from_business_id')
  const toId = req.nextUrl.searchParams.get('to_business_id')

  let query = supabase
    .from('business_approaches')
    .select('*')
    .order('created_at', { ascending: false })

  if (fromId) {
    query = query.eq('from_business_id', fromId)
  } else if (toId) {
    query = query.eq('to_business_id', toId)
  } else {
    return NextResponse.json({ error: 'from_business_id or to_business_id required' }, { status: 400 })
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 関連する企業プロフィールを付与
  const enriched = await Promise.all(
    (data || []).map(async (approach) => {
      const [fromProfile, toProfile] = await Promise.all([
        supabase.from('business_profiles').select('*').eq('user_id', approach.from_business_id).single(),
        supabase.from('business_profiles').select('*').eq('user_id', approach.to_business_id).single(),
      ])

      return {
        ...approach,
        from_profile: fromProfile.data,
        to_profile: toProfile.data,
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { from_business_id, to_business_id, message } = body

  if (!from_business_id || !to_business_id) {
    return NextResponse.json({ error: 'from_business_id and to_business_id required' }, { status: 400 })
  }

  // 重複チェック（同じ相手へのpendingアプローチが既にないか）
  const { data: existing } = await supabase
    .from('business_approaches')
    .select('id')
    .eq('from_business_id', from_business_id)
    .eq('to_business_id', to_business_id)
    .eq('status', 'pending')
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'この企業へのアプローチは既に送信済みです' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('business_approaches')
    .insert({
      from_business_id,
      to_business_id,
      message: message || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // アプローチ先企業の情報を取得
  const { data: fromProfile } = await supabase
    .from('business_profiles')
    .select('company_name')
    .eq('user_id', from_business_id)
    .single()

  const fromName = fromProfile?.company_name || '企業'

  // アプリ内通知
  await supabase.from('notifications').insert({
    user_id: to_business_id,
    type: 'new_application',
    title: `🏢 ${fromName}からアプローチが届きました！`,
    message: message || '詳細を確認して、承諾するかどうかお選びください。',
    link: '/b/approaches',
    profile_link: `/b/company/${from_business_id}`,
    role: 'business',
    is_read: false,
  })

  // LINE通知
  const { data: toUser } = await supabase
    .from('users')
    .select('line_id')
    .eq('id', to_business_id)
    .single()

  if (toUser?.line_id) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://career-book-okinawa-seven.vercel.app'
    await sendLinePush(
      toUser.line_id,
      `🏢 ${fromName}からアプローチが届きました！\n\n${message || '詳細を確認してください。'}\n\n▼ アプローチを確認する\n${appUrl}/b/approaches`
    )
  }

  return NextResponse.json(data)
}
