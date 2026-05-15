'use client'
import { useState, useEffect } from 'react'
import { initLiff, liff, isLiffLoggedIn, isInLiffClient } from '@/lib/liff'
import type { UserRole } from '@/types/database'

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [liffReady, setLiffReady] = useState(false)
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false)
  const [lineProfile, setLineProfile] = useState<{ userId: string; displayName: string; pictureUrl: string | null } | null>(null)

  useEffect(() => {
    checkExistingLogin()
  }, [])

  async function checkExistingLogin() {
    try {
      // 1. localStorageにユーザー情報がある → ホームへ
      const userId = localStorage.getItem('user_id')
      const userRole = localStorage.getItem('user_role') as UserRole
      if (userId && userRole) {
        window.location.href = userRole === 'business' ? '/b/home' : '/u/home'
        return
      }

      // 2. URLに認証コードがある → サーバーAPIでプロフィール取得
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      if (code) {
        // URLをクリーン
        window.history.replaceState({}, '', window.location.pathname)

        const res = await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (res.ok) {
          const profile = await res.json()
          setLineProfile(profile)
          setAlreadyLoggedIn(true)

          // ロール情報が保存されてたら即登録
          const savedRole = localStorage.getItem('selected_role') as UserRole | null
          if (savedRole) {
            await registerUserWithProfile(profile, savedRole)
            return
          }
        } else {
          setError('LINEログインに失敗しました。もう一度お試しください。')
        }
        setIsCheckingAuth(false)
        return
      }

      // 3. LIFF初期化
      const ok = await initLiff()
      setLiffReady(ok)

      if (ok && isLiffLoggedIn()) {
        // LIFF内ブラウザでログイン済み
        const savedRole = localStorage.getItem('selected_role') as UserRole | null
        if (savedRole) {
          await registerUser(savedRole)
          return
        }
        setAlreadyLoggedIn(true)
      }
    } catch (e: unknown) {
      console.error('Auth check:', e)
      const msg = e instanceof Error ? e.message : '認証エラー'
      setError(msg)
    }
    setIsCheckingAuth(false)
  }

  async function registerUserWithProfile(
    profile: { userId: string; displayName: string; pictureUrl: string | null },
    role: UserRole
  ) {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_id: profile.userId,
          display_name: profile.displayName,
          avatar_url: profile.pictureUrl || null,
          role,
        }),
      })

      if (!res.ok) throw new Error(`登録エラー: ${res.status}`)

      const user = await res.json()
      saveUserToLocalStorage(user, profile.displayName)
      redirectAfterLogin(user)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ユーザー登録に失敗しました'
      setError(msg)
      setIsLoading(false)
      setIsCheckingAuth(false)
    }
  }

  async function registerUser(role: UserRole) {
    try {
      const profile = await liff.getProfile()
      await registerUserWithProfile(
        { userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl || null },
        role
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ユーザー登録に失敗しました'
      setError(msg)
      setIsLoading(false)
      setIsCheckingAuth(false)
    }
  }

  function saveUserToLocalStorage(user: Record<string, unknown>, lineDisplayName: string) {
    const displayName = (user.nickname || user.display_name || lineDisplayName) as string
    localStorage.setItem('user_id', user.id as string)
    localStorage.setItem('user_name', displayName)
    const avatarUrl = (user.avatar_url || '') as string
    const isCustom = avatarUrl.includes('/avatars/')
    localStorage.setItem('user_avatar', isCustom ? avatarUrl : '')
    localStorage.setItem('user_role', user.role as string)
    localStorage.setItem('user_nickname', displayName)
    localStorage.removeItem('selected_role')
  }

  function redirectAfterLogin(user: Record<string, unknown>) {
    if (user.role === 'user') {
      if (!user.profile_completed) {
        window.location.href = '/u/profile-setup'
        return
      }
      window.location.href = '/u/home'
      return
    }

    // 企業の場合: business_profileチェック
    fetch(`/api/business-profiles?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.error || !data.company_name) {
          window.location.href = '/b/profile-setup'
        } else {
          window.location.href = '/b/home'
        }
      })
      .catch(() => {
        window.location.href = '/b/profile-setup'
      })
  }

  async function handleLogin() {
    if (!selectedRole) return
    setIsLoading(true)
    setError('')

    localStorage.setItem('selected_role', selectedRole)

    // LINE認証済み（プロフィール取得済み）→ 即登録
    if (lineProfile) {
      await registerUserWithProfile(lineProfile, selectedRole)
      return
    }

    // LIFF内ブラウザでログイン済み → 即登録
    if (liffReady && isLiffLoggedIn()) {
      await registerUser(selectedRole)
      return
    }

    if (liffReady && isInLiffClient()) {
      await registerUser(selectedRole)
      return
    }

    // 外部ブラウザ → LINE OAuth認証URLに直接リダイレクト
    const channelId = process.env.NEXT_PUBLIC_LIFF_ID?.split('-')[0]
    const redirectUri = encodeURIComponent(window.location.origin)
    const state = Math.random().toString(36).substring(2)
    const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`
    window.location.href = loginUrl
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-400 font-bold">認証中...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80')` }} />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <span className="text-4xl">🔧</span>
        </div>

        <h1 className="text-white text-3xl font-black mb-2 tracking-tight text-center">匿名キャリアブック</h1>
        <div className="bg-orange-500 text-white text-sm font-black px-5 py-1 rounded-full mb-3 tracking-widest">沖　縄</div>
        <p className="text-white/80 text-sm text-center mb-8 leading-relaxed">沖縄の建設現場をつなぐ<br />マッチングサービス</p>

        {error && (
          <div className="w-full max-w-sm bg-red-500/20 border border-red-400/40 rounded-2xl p-3 mb-4">
            <p className="text-red-200 text-xs text-center font-bold">{error}</p>
          </div>
        )}

        {alreadyLoggedIn && (
          <div className="w-full max-w-sm bg-green-500/20 border border-green-400/40 rounded-2xl p-3 mb-4">
            <p className="text-green-200 text-xs text-center font-bold">✅ LINEログイン済み — 立場を選んでください</p>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3 mb-6">
          <p className="text-white/90 text-center text-sm font-bold mb-2">あなたの立場を選んでください</p>

          <button onClick={() => setSelectedRole('user')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedRole === 'user' ? 'border-blue-400 bg-blue-600/30 shadow-lg shadow-blue-500/20' : 'border-white/20 bg-white/10'
            }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔧</span>
              <div>
                <p className="text-white font-black text-base">仕事を探す</p>
                <p className="text-white/60 text-xs">職人・作業員として応募</p>
              </div>
              {selectedRole === 'user' && <span className="ml-auto text-blue-400 text-xl">✓</span>}
            </div>
          </button>

          <button onClick={() => setSelectedRole('business')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedRole === 'business' ? 'border-orange-400 bg-orange-500/30 shadow-lg shadow-orange-500/20' : 'border-white/20 bg-white/10'
            }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏢</span>
              <div>
                <p className="text-white font-black text-base">人材を募集する</p>
                <p className="text-white/60 text-xs">事業者として募集を投稿</p>
              </div>
              {selectedRole === 'business' && <span className="ml-auto text-orange-400 text-xl">✓</span>}
            </div>
          </button>
        </div>

        <button onClick={handleLogin} disabled={!selectedRole || isLoading}
          className={`w-full max-w-sm ${alreadyLoggedIn ? 'bg-blue-600' : 'bg-[#06C755]'} text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all ${
            !selectedRole ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'
          }`}>
          {isLoading ? (
            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
          ) : alreadyLoggedIn ? (
            '始める'
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.97C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEでログイン
            </>
          )}
        </button>

        {!alreadyLoggedIn && (
          <p className="text-white/50 text-xs text-center mt-3">LINEアカウントで簡単ログイン</p>
        )}
      </div>
    </main>
  )
}
