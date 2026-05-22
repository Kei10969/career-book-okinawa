import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendLinePush } from '@/lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('application_id')
  const cancelledBy = req.nextUrl.searchParams.get('cancelled_by')

  let query = supabase
    .from('cancellations')
    .select('*')

  if (applicationId) query = query.eq('application_id', applicationId)
  if (cancelledBy) query = query.eq('cancelled_by', cancelledBy)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cancel_type, application_id, cancelled_by, reason } = body

  // 応募情報を取得（関連データ含む）
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('*, applicant:users!applicant_id(id, line_id, display_name), request:requests!request_id(id, title, user_id)')
    .eq('id', application_id)
    .single()

  if (appError || !app) {
    return NextResponse.json({ error: '応募が見つかりません' }, { status: 404 })
  }

  const applicant = app.applicant as { id: string; line_id: string | null; display_name: string }
  const request = app.request as { id: string; title: string; user_id: string }

  // キャンセルされる相手のIDを特定
  const cancelledUserId = cancelled_by === applicant.id ? request.user_id : applicant.id

  // キャンセルレコード作成
  const { data: cancellation, error: cancelError } = await supabase
    .from('cancellations')
    .insert({
      application_id,
      cancelled_by,
      cancel_type,
      reason: reason || null,
    })
    .select()
    .single()

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message }, { status: 500 })
  }

  // ペナルティ処理
  if (cancel_type === 'late') {
    // late_cancel_count +1
    const { data: user } = await supabase
      .from('users')
      .select('late_cancel_count')
      .eq('id', cancelled_by === applicant.id ? applicant.id : applicant.id)
      .single()
    
    // ペナルティ対象は cancelled_by ではなく、報告された側（企業が報告→職人がペナルティ）
    // ただし職人が自分でキャンセル→職人自身がペナルティ
    const penaltyUserId = cancelled_by === request.user_id ? applicant.id : cancelled_by
    
    const { data: penaltyUser } = await supabase
      .from('users')
      .select('late_cancel_count')
      .eq('id', penaltyUserId)
      .single()

    const newCount = (penaltyUser?.late_cancel_count || 0) + 1
    await supabase
      .from('users')
      .update({
        late_cancel_count: newCount,
        ...(newCount >= 3 ? { is_suspended: true } : {}),
      })
      .eq('id', penaltyUserId)
  }

  if (cancel_type === 'no_show') {
    const penaltyUserId = cancelled_by === request.user_id ? applicant.id : cancelled_by
    
    const { data: penaltyUser } = await supabase
      .from('users')
      .select('no_show_count')
      .eq('id', penaltyUserId)
      .single()

    const newCount = (penaltyUser?.no_show_count || 0) + 1
    await supabase
      .from('users')
      .update({
        no_show_count: newCount,
        ...(newCount >= 2 ? { is_suspended: true } : {}),
      })
      .eq('id', penaltyUserId)
  }

  // applicationsのstatusをcancelledに更新
  await supabase
    .from('applications')
    .update({ status: 'cancelled' })
    .eq('id', application_id)

  // アプリ内通知を送信
  const cancelTypeLabel = cancel_type === 'late' ? '当日キャンセル' : cancel_type === 'no_show' ? '無断キャンセル' : 'キャンセル'
  await supabase.from('notifications').insert({
    user_id: cancelledUserId,
    type: 'new_application',
    title: `${cancelTypeLabel}の報告`,
    message: `「${request.title}」が${cancelTypeLabel}されました。`,
    link: cancelled_by === request.user_id ? `/u/mypage` : `/b/requests/${request.id}`,
  })

  // LINE通知を送信
  const { data: targetUser } = await supabase
    .from('users')
    .select('line_id')
    .eq('id', cancelledUserId)
    .single()

  if (targetUser?.line_id) {
    await sendLinePush(
      targetUser.line_id,
      `⚠️ ${cancelTypeLabel}の報告\n\n「${request.title}」が${cancelTypeLabel}されました。`
    )
  }

  return NextResponse.json(cancellation)
}
