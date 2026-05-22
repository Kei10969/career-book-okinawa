import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const revieweeId = req.nextUrl.searchParams.get('reviewee_id')
  const applicationId = req.nextUrl.searchParams.get('application_id')
  const reviewerId = req.nextUrl.searchParams.get('reviewer_id')

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

  return NextResponse.json({
    avg_quality: avg('quality_rating'),
    avg_deadline: avg('deadline_rating'),
    avg_communication: avg('communication_rating'),
    avg_repeat: avg('repeat_rating'),
    total_reviews: total,
  })
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
