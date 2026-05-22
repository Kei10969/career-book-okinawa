import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendLinePush } from '@/lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // キャンセル情報を取得
  const { data: cancellation, error: cancelError } = await supabase
    .from('cancellations')
    .select('*, application:applications!application_id(*, applicant:users!applicant_id(id, line_id, display_name), request:requests!request_id(id, title, user_id))')
    .eq('id', id)
    .single()

  if (cancelError || !cancellation) {
    return NextResponse.json({ error: 'キャンセルが見つかりません' }, { status: 404 })
  }

  // is_revoked=true, revoked_at=now()に更新
  const { error: updateError } = await supabase
    .from('cancellations')
    .update({ is_revoked: true, revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const application = cancellation.application as {
    applicant: { id: string; line_id: string | null; display_name: string }
    request: { id: string; title: string; user_id: string }
  }

  // ペナルティ対象ユーザーを特定（企業が報告→職人がペナルティだった）
  const penaltyUserId = cancellation.cancelled_by === application.request.user_id
    ? application.applicant.id
    : cancellation.cancelled_by

  // カウントを-1
  if (cancellation.cancel_type === 'late') {
    const { data: user } = await supabase
      .from('users')
      .select('late_cancel_count, no_show_count')
      .eq('id', penaltyUserId)
      .single()

    const newCount = Math.max(0, (user?.late_cancel_count || 0) - 1)
    const isSuspended = newCount >= 3 || (user?.no_show_count || 0) >= 2
    await supabase
      .from('users')
      .update({ late_cancel_count: newCount, is_suspended: isSuspended })
      .eq('id', penaltyUserId)
  }

  if (cancellation.cancel_type === 'no_show') {
    const { data: user } = await supabase
      .from('users')
      .select('late_cancel_count, no_show_count')
      .eq('id', penaltyUserId)
      .single()

    const newCount = Math.max(0, (user?.no_show_count || 0) - 1)
    const isSuspended = (user?.late_cancel_count || 0) >= 3 || newCount >= 2
    await supabase
      .from('users')
      .update({ no_show_count: newCount, is_suspended: isSuspended })
      .eq('id', penaltyUserId)
  }

  // applicationsのstatusをapprovedに戻す
  await supabase
    .from('applications')
    .update({ status: 'approved' })
    .eq('id', cancellation.application_id)

  // 取り消し通知を相手に送信
  const notifyUserId = penaltyUserId
  await supabase.from('notifications').insert({
    user_id: notifyUserId,
    type: 'new_application',
    title: 'キャンセル報告の取り消し',
    message: `「${application.request.title}」のキャンセル報告が取り消されました。`,
    link: `/u/mypage`,
  })

  const { data: targetUser } = await supabase
    .from('users')
    .select('line_id')
    .eq('id', notifyUserId)
    .single()

  if (targetUser?.line_id) {
    await sendLinePush(
      targetUser.line_id,
      `✅ キャンセル報告の取り消し\n\n「${application.request.title}」のキャンセル報告が取り消されました。`
    )
  }

  return NextResponse.json({ success: true })
}
