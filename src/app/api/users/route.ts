import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// LINEログイン後にユーザーを取得または作成
export async function POST(req: NextRequest) {
  const { line_id, display_name, avatar_url, role } = await req.json()

  if (!line_id || !display_name) {
    return NextResponse.json({ error: 'line_id and display_name required' }, { status: 400 })
  }

  const userRole = role === 'business' ? 'business' : 'user'

  // 既存ユーザー検索
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('line_id', line_id)
    .single()

  if (existing) {
    // アバター・ロール更新
    const updates: Record<string, string> = {}
    if (avatar_url && existing.avatar_url !== avatar_url) updates.avatar_url = avatar_url
    if (userRole !== existing.role) updates.role = userRole

    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', existing.id)
    }

    return NextResponse.json({ ...existing, ...updates })
  }

  // 新規作成
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      line_id,
      display_name,
      avatar_url,
      role: userRole,
      nickname: display_name,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(newUser)
}
