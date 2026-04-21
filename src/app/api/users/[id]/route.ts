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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    ...data,
    role: data.role || typeToRole(data.type || 'individual'),
    nickname: data.nickname || data.display_name,
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const allowedFields = ['display_name', 'avatar_url', 'company_name', 'bio', 'skills', 'areas']
  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    ...data,
    role: data.role || typeToRole(data.type || 'individual'),
    nickname: data.nickname || data.display_name,
  })
}
