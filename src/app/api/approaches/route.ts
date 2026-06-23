import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendLinePush } from '@/lib/line-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const workerUserId = req.nextUrl.searchParams.get('worker_user_id')
  const businessUserId = req.nextUrl.searchParams.get('business_user_id')

  let query = supabase.from('approaches').select('*').order('created_at', { ascending: false })

  if (workerUserId) {
    query = query.eq('worker_user_id', workerUserId)
  } else if (businessUserId) {
    query = query.eq('business_user_id', businessUserId)
  } else {
    return NextResponse.json({ error: 'worker_user_id or business_user_id required' }, { status: 400 })
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 関連ユーザー情報を取得
  const enriched = await Promise.all(
    (data || []).map(async (approach) => {
      const [workerRes, bizProfileRes] = await Promise.all([
        supabase.from('users').select('id, display_name, skills, areas, qualifications, experience_years, desired_salary, job_status, bio, phone, email').eq('id', approach.worker_user_id).single(),
        supabase.from('business_profiles').select('*').eq('user_id', approach.business_user_id).single(),
      ])

      // 職人情報（承諾時のみ連絡先を開示）
      const workerData = workerRes.data
      let workerUser = null
      if (workerData) {
        workerUser = {
          id: workerData.id,
          display_name: workerData.display_name,
          skills: workerData.skills,
          areas: workerData.areas,
          qualifications: workerData.qualifications,
          experience_years: workerData.experience_years,
          desired_salary: workerData.desired_salary,
          job_status: workerData.job_status,
          bio: workerData.bio,
          ...(approach.status === 'accepted' ? {
            phone: workerData.phone,
            email: workerData.email,
          } : {}),
        }
      }

      return {
        ...approach,
        worker_user: workerUser,
        business_profile: bizProfileRes.data,
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { business_user_id, worker_user_id, message } = body

  if (!business_user_id || !worker_user_id) {
    return NextResponse.json({ error: 'business_user_id and worker_user_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('approaches')
    .insert({
      business_user_id,
      worker_user_id,
      message: message || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 職人にアプリ内通知を送信 → 企業プロフィールへリンク
  await supabase.from('notifications').insert({
    user_id: worker_user_id,
    type: 'new_application',
    title: '🏢 企業からアプローチが届きました！',
    message: '内容を確認して、承諾するかどうかお選びください。',
    link: `/u/business/${business_user_id}`,
    profile_link: `/u/business/${business_user_id}`,
    role: 'user',
    is_read: false,
  })

  // 職人にLINEプッシュ通知を送信
  const { data: workerUser } = await supabase
    .from('users')
    .select('line_id')
    .eq('id', worker_user_id)
    .single()

  if (workerUser?.line_id) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://career-book-okinawa-seven.vercel.app'
    await sendLinePush(
      workerUser.line_id,
      `🏢 企業からアプローチが届きました！\n\n内容を確認して、承諾するかどうかお選びください。\n\n▼ 企業プロフィールを見る\n${appUrl}/u/business/${business_user_id}`
    )
  }

  return NextResponse.json(data)
}
