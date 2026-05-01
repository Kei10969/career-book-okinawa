import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('user_id') as string | null

  if (!file || !userId) {
    return NextResponse.json({ error: 'file and user_id required' }, { status: 400 })
  }

  // ファイル名: user_id + 拡張子（上書き方式）
  const ext = file.name.split('.').pop() || 'jpg'
  const filePath = `${userId}.${ext}`

  // アップロード（既存ファイルは上書き）
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}` // キャッシュバスト

  // usersテーブルのavatar_urlを更新
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: avatarUrl })
}
