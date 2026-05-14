import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 職人（individual）ユーザーの匿名プロフィール一覧を返す
export async function GET(req: NextRequest) {
  const trade = req.nextUrl.searchParams.get('trade')
  const area = req.nextUrl.searchParams.get('area')
  const jobStatus = req.nextUrl.searchParams.get('job_status')

  let query = supabase
    .from('users')
    .select('id, skills, areas, qualifications, experience_years, desired_salary, job_status, bio, profile_completed')
    .eq('type', 'individual')
    .eq('profile_completed', true)
    .order('created_at', { ascending: false })

  if (trade) {
    query = query.contains('skills', [trade])
  }
  if (area) {
    query = query.contains('areas', [area])
  }
  if (jobStatus) {
    query = query.eq('job_status', jobStatus)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
