import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const revieweeId = req.nextUrl.searchParams.get('reviewee_id')
  const revieweeIds = req.nextUrl.searchParams.get('reviewee_ids')
  const applicationId = req.nextUrl.searchParams.get('application_id')
  const reviewerId = req.nextUrl.searchParams.get('reviewer_id')
  const mode = req.nextUrl.searchParams.get('mode')

  // mode=reviewed_apps: reviewer_idが評価済みのapplication_id一覧を返す
  if (mode === 'reviewed_apps' && reviewerId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('application_id')
      .eq('reviewer_id', reviewerId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const ids = data?.map(r => r.application_id) || []
    const response = NextResponse.json({ reviewed_application_ids: ids })
    response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=120')
    return response
  }

  // reviewee_ids: 複数ユーザーの評価サマリーを一括返却
  if (revieweeIds) {
    const ids = revieweeIds.split(',').filter(Boolean)
    if (ids.length === 0) return NextResponse.json({})

    const { data, error } = await supabase
      .from('reviews')
      .select('reviewee_id, quality_rating, deadline_rating, communication_rating, repeat_rating')
      .in('reviewee_id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const summaries: Record<string, { avg: number; total: number }> = {}
    const grouped: Record<string, Array<{ quality_rating: number; deadline_rating: number; communication_rating: number; repeat_rating: number }>> = {}
    for (const r of (data || [])) {
      if (!grouped[r.reviewee_id]) grouped[r.reviewee_id] = []
      grouped[r.reviewee_id].push(r)
    }
    for (const [uid, reviews] of Object.entries(grouped)) {
      const total = reviews.length
      const avgQ = reviews.reduce((s, r) => s + (r.quality_rating || 0), 0) / total
      const avgD = reviews.reduce((s, r) => s + (r.deadline_rating || 0), 0) / total
      const avgC = reviews.reduce((s, r) => s + (r.communication_rating || 0), 0) / total
      const avgR = reviews.reduce((s, r) => s + (r.repeat_rating || 0), 0) / total
      const avg = Math.round(((avgQ + avgD + avgC + avgR) / 4) * 10) / 10
      summaries[uid] = { avg, total }
    }

    const response = NextResponse.json(summaries)
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    return response
  }

  // 特定の application_id + reviewer_id の組み合わせで既存チェック
  if (applicationId && reviewerId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('application_id', applicationId)
      .eq('reviewer_id', reviewerId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ exists: data && data.length > 0, reviews: data })
  }

  if (!revieweeId) {
    return NextResponse.json({ error: 'reviewee_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', revieweeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) {
    return NextResponse.json({
      avg_quality: 0,
      avg_deadline: 0,
      avg_communication: 0,
      avg_repeat: 0,
      total_reviews: 0,
    })
  }

  const total = data.length
  const avg = (key: string) => {
    const sum = data.reduce((acc, r) => acc + (r[key] || 0), 0)
    return Math.round((sum / total) * 10) / 10
  }

  const response = NextResponse.json({
    avg_quality: avg('quality_rating'),
    avg_deadline: avg('deadline_rating'),
    avg_communication: avg('communication_rating'),
    avg_repeat: avg('repeat_rating'),
    total_reviews: total,
  })
  response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
  return response
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { application_id, reviewer_id, reviewee_id, review_type, quality_rating, deadline_rating, communication_rating, repeat_rating, comment } = body

  // 重複チェック
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('application_id', application_id)
    .eq('reviewer_id', reviewer_id)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'この応募に対する評価は既に送信済みです' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      application_id,
      reviewer_id,
      reviewee_id,
      review_type,
      quality_rating,
      deadline_rating,
      communication_rating,
      repeat_rating,
      comment: comment || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
