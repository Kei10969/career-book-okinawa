import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendLinePush } from '@/lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get('request_id')
  const applicantId = req.nextUrl.searchParams.get('applicant_id')

  let query = supabase
    .from('applications')
    .select('*, applicant:users!applicant_id(id, display_name, avatar_url, skills, areas, qualifications, experience_years, desired_salary, job_status, bio), request:requests!request_id(title, area, trade)')

  if (requestId) query = query.eq('request_id', requestId)
  if (applicantId) query = query.eq('applicant_id', applicantId)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('applications').insert(body).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  // 応募情報を取得（関連データ含む）
  const { data: app } = await supabase
    .from('applications')
    .select('*, applicant:users!applicant_id(id, line_id, display_name, phone, email), request:requests!request_id(id, title, user_id)')
    .eq('id', id)
    .single()

  // ステータス更新
  const { data, error } = await supabase.from('applications').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const newStatus = updates.status
  const applicant = app?.applicant as { id: string; line_id: string | null; display_name: string; phone: string | null; email: string | null } | null
  const request = app?.request as { id: string; title: string; user_id: string } | null

  if (newStatus && applicant && request) {
    if (newStatus === 'approved') {
      // 成立: 職人に通知
      await supabase.from('notifications').insert({
        user_id: applicant.id,
        type: 'application_approved',
        title: '応募が成立しました！',
        message: `「${request.title}」への応募が承認されました。企業からの連絡をお待ちください。`,
        link: `/u/mypage`,
      })

      // 企業に通知（連絡先付き）
      const contactInfo = [
        applicant.phone ? `電話: ${applicant.phone}` : null,
        applicant.email ? `メール: ${applicant.email}` : null,
      ].filter(Boolean).join(' / ')

      await supabase.from('notifications').insert({
        user_id: request.user_id,
        type: 'application_approved',
        title: '応募が成立しました！',
        message: `「${request.title}」への応募者（${applicant.display_name}）と成立しました。${contactInfo ? `連絡先: ${contactInfo}` : '連絡先が未登録です。'}`,
        link: `/b/requests/${request.id}`,
      })

      // LINE プッシュ通知: 職人へ
      if (applicant.line_id) {
        await sendLinePush(
          applicant.line_id,
          `🎉 応募が成立しました！\n\n「${request.title}」への応募が承認されました。\n企業からの連絡をお待ちください。`
        )
      }

      // LINE プッシュ通知: 企業へ
      const { data: businessUser } = await supabase
        .from('users')
        .select('line_id')
        .eq('id', request.user_id)
        .single()
      if (businessUser?.line_id) {
        const contactParts = [
          applicant.phone ? `電話: ${applicant.phone}` : null,
          applicant.email ? `メール: ${applicant.email}` : null,
        ].filter(Boolean).join('\n')
        await sendLinePush(
          businessUser.line_id,
          `✅ 応募が成立しました！\n\n「${request.title}」\n応募者: ${applicant.display_name}\n${contactParts || '連絡先: 未登録'}`
        )
      }

      // レスポンスに連絡先を含める
      return NextResponse.json({
        ...data,
        applicant_contact: {
          display_name: applicant.display_name,
          phone: applicant.phone,
          email: applicant.email,
        },
      })
    }

    if (newStatus === 'rejected') {
      // 却下: 職人に通知
      await supabase.from('notifications').insert({
        user_id: applicant.id,
        type: 'application_rejected',
        title: '応募結果のお知らせ',
        message: `「${request.title}」への応募は、今回は見送りとなりました。`,
        link: `/u/mypage`,
      })

      // 企業に通知
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        type: 'application_rejected',
        title: '応募を却下しました',
        message: `「${request.title}」への応募者（${applicant.display_name}）を却下しました。`,
        link: `/b/requests/${request.id}`,
      })

      // LINE プッシュ通知: 職人へ
      if (applicant.line_id) {
        await sendLinePush(
          applicant.line_id,
          `📋 応募結果のお知らせ\n\n「${request.title}」への応募は、今回は見送りとなりました。\n\n引き続き他の募集もチェックしてみてください。`
        )
      }
    }
  }

  return NextResponse.json(data)
}
