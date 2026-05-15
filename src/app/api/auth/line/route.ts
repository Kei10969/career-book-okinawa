import { NextRequest, NextResponse } from 'next/server'

const CHANNEL_ID = process.env.LINE_CHANNEL_ID!
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL || 'https://career-book-okinawa-seven.vercel.app'

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 })
  }

  try {
    // 1. 認証コード → アクセストークン交換
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CHANNEL_ID,
        client_secret: CHANNEL_SECRET,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('Token exchange failed:', err)
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 401 })
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 2. アクセストークン → プロフィール取得
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!profileRes.ok) {
      return NextResponse.json({ error: 'Profile fetch failed' }, { status: 401 })
    }

    const profile = await profileRes.json()

    return NextResponse.json({
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || null,
    })
  } catch (e) {
    console.error('LINE auth error:', e)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
