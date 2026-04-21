import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// role値の変換: フロント → DB
// DB側がまだ type カラム（individual/company）の場合に対応
function roleToType(role: string): string {
  if (role === 'business') return 'company'
  return 'individual'
}

// type値の変換: DB → フロント
function typeToRole(type: string): string {
  if (type === 'company') return 'business'
  return 'user'
}

// LINEログイン後にユーザーを取得または作成
export async function POST(req: NextRequest) {
  const { line_id, display_name, avatar_url, role } = await req.json()

  if (!line_id || !display_name) {
    return NextResponse.json({ error: 'line_id and display_name required' }, { status: 400 })
  }

  const userRole = role === 'business' ? 'business' : 'user'
  const dbType = roleToType(userRole)

  // 既存ユーザー検索
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('line_id', line_id)
    .single()

  if (existing) {
    // アバター更新
    const updates: Record<string, string> = {}
    if (avatar_url && existing.avatar_url !== avatar_url) updates.avatar_url = avatar_url
    // type が違えば更新
    if (existing.type && dbType !== existing.type) updates.type = dbType

    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', existing.id)
    }

    // フロント向けに role を付与して返す
    return NextResponse.json({
      ...existing,
      ...updates,
      role: typeToRole(updates.type || existing.type || existing.role || 'individual'),
      nickname: existing.nickname || existing.display_name,
    })
  }

  // 新規作成
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      line_id,
      display_name,
      avatar_url,
      type: dbType,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ...newUser,
    role: userRole,
    nickname: newUser.display_name,
  })
}
