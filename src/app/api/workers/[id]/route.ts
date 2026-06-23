import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 職人の匿名プロフィール詳細を返す
// viewer_id パラメータがあり、その企業とアプローチ成立済みの場合のみ連絡先を開示
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewerId = req.nextUrl.searchParams.get('viewer_id')

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, phone, email, skills, areas, qualifications, experience_years, desired_salary, job_status, bio, profile_completed')
    .eq('id', id)
    .eq('type', 'individual')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // アプローチ成立 or 応募成立をチェック
  let contactVisible = false
  if (viewerId) {
    // アプローチ成立チェック
    const { data: approach } = await supabase
      .from('approaches')
      .select('id')
      .eq('business_user_id', viewerId)
      .eq('worker_user_id', id)
      .eq('status', 'accepted')
      .limit(1)

    if (approach && approach.length > 0) {
      contactVisible = true
    }

    // 応募成立チェック（企業の募集に職人が応募して承認された場合）
    if (!contactVisible) {
      const { data: userRequests } = await supabase
        .from('requests')
        .select('id')
        .eq('user_id', viewerId)

      if (userRequests && userRequests.length > 0) {
        const requestIds = userRequests.map(r => r.id)
        const { data: approvedApp } = await supabase
          .from('applications')
          .select('id')
          .in('request_id', requestIds)
          .eq('applicant_id', id)
          .eq('status', 'approved')
          .limit(1)

        if (approvedApp && approvedApp.length > 0) {
          contactVisible = true
        }
      }
    }
  }

  // 連絡先を含めるかどうかで返すデータを分ける
  if (contactVisible) {
    return NextResponse.json(data)
  } else {
    // 匿名: display_name, phone, email を除外
    const { display_name, phone, email, ...anonymousData } = data
    return NextResponse.json(anonymousData)
  }
}
