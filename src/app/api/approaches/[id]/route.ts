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
    .from('approaches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 関連ユーザー情報を取得
  const [workerRes, businessRes] = await Promise.all([
    supabase.from('users').select('id, display_name, phone, email, line_id').eq('id', data.worker_user_id).single(),
    supabase.from('users').select('id, display_name, line_id').eq('id', data.business_user_id).single(),
  ])

  const worker = workerRes.data
  const business = businessRes.data

  if (status === 'accepted') {
    const contactPhone = worker?.phone || '未登録'
    const contactEmail = worker?.email || '未登録'
    const workerName = worker?.display_name || '職人'

    // 企業にアプリ内通知（連絡先付き）
    await supabase.from('notifications').insert({
      user_id: data.business_user_id,
      type: 'application_approved',
      title: 'アプローチが承諾されました！',
      message: `${workerName}さんがアプローチを承諾しました。連絡先: 電話 ${contactPhone} / メール ${contactEmail}`,
      link: '/b/home',
      is_read: false,
    })

    // 企業にLINE通知
    if (business?.line_id) {
      await sendLinePush(
        business.line_id,
        `✅ アプローチが承諾されました！\n連絡先: 電話 ${contactPhone} / メール ${contactEmail}`
      )
    }

    // 職人にアプリ内通知
    await supabase.from('notifications').insert({
      user_id: data.worker_user_id,
      type: 'application_approved',
      title: 'アプローチを承諾しました',
      message: '企業への連絡をお待ちください',
      link: '/u/home',
      is_read: false,
    })

    // 承諾時は職人の連絡先をレスポンスに含める
    return NextResponse.json({
      ...data,
      worker_contact: {
        phone: worker?.phone || null,
        email: worker?.email || null,
      },
    })
  } else {
    // rejected
    // 企業にアプリ内通知
    await supabase.from('notifications').insert({
      user_id: data.business_user_id,
      type: 'application_rejected',
      title: 'アプローチ結果のお知らせ',
      message: '今回は見送りとなりました',
      link: '/b/home',
      is_read: false,
    })

    // 企業にLINE通知
    if (business?.line_id) {
      await sendLinePush(
        business.line_id,
        '📋 アプローチ結果\n今回は見送りとなりました。'
      )
    }

    return NextResponse.json(data)
  }
}
