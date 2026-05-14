import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function typeToRole(type: string): string {
  if (type === 'company') return 'business'
  return 'user'
}

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
      const [bizRes, workerRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', approach.business_user_id).single(),
        supabase.from('users').select('*').eq('id', approach.worker_user_id).single(),
      ])

      const businessUser = bizRes.data ? {
        ...bizRes.data,
        role: typeToRole(bizRes.data.type || 'individual'),
      } : null

      // status === 'accepted' の場合のみworkerの連絡先を開示
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
          role: typeToRole(workerData.type || 'individual'),
          ...(approach.status === 'accepted' ? {
            phone: workerData.phone,
            email: workerData.email,
          } : {}),
        }
      }

      // 企業プロフィール情報も取得
      const { data: bizProfile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', approach.business_user_id)
        .single()

      return {
        ...approach,
        business_user: businessUser,
        worker_user: workerUser,
        business_profile: bizProfile,
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

  // 重複チェック（同じ企業→同じ職人へのpendingアプローチが既にある場合）
  const { data: existing } = await supabase
    .from('approaches')
    .select('id')
    .eq('business_user_id', business_user_id)
    .eq('worker_user_id', worker_user_id)
    .eq('status', 'pending')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'すでにアプローチ済みです' }, { status: 409 })
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
  return NextResponse.json(data)
}
